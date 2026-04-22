import { Participant } from '../../types';

export interface MemberBalance {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
  avatarUrl?: string;
  fundContributed: number;
  paidOnBehalf: number;
  fairShare: number;
  balance: number;
  isTreasurer: boolean;
}

export interface MemberExpenseDetail {
  expenseId: string;
  reason: string;
  category: string;
  amount: number;
  shareAmount: number;
  participantCount: number;
  payerName: string;
  date: string;
}

export interface PaymentTransaction {
  from: { id: string; name: string; initials: string; avatarUrl?: string; colorClass: string };
  to: { id: string; name: string; initials: string; avatarUrl?: string; colorClass: string };
  amount: number;
  type: 'pay' | 'receive';
}

export interface CategorySpend {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

export interface SettlementStats {
  biggestExpense: { reason: string; amount: number; payerName: string };
  topContributor: { name: string; amount: number };
  biggestCategory: { category: string; amount: number };
  averagePerPerson: number;
  transactionCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Ẩm thực': 'bg-orange-400',
  'Di chuyển': 'bg-blue-400',
  'Giải trí': 'bg-purple-400',
  'Lưu trú': 'bg-emerald-400',
  'Khác': 'bg-gray-400',
};

export function computeMemberBalances(
  participants: Participant[],
  expenses: any[],
  fundContributions: any[],
  treasurerId: string
): MemberBalance[] {
  // Calculate each member's share based on their participation in each expense
  const memberShares = new Map<string, number>();

  // Initialize all members with 0 share
  participants.forEach(p => memberShares.set(p.id, 0));

  // For each expense, calculate each participant's fair share
  expenses.forEach(e => {
    const amount = Number(e.amount);
    // Get participant_ids from expense_participants (junction table)
    const expensePs = e.expense_participants || [];
    // Only use actual participants if data exists, otherwise don't divide
    let participantIds: string[] = [];
    if (expensePs.length > 0) {
      participantIds = expensePs.map((ep: any) => ep.participant_id);
    } else {
      // Old expense without participant data - all participants share equally
      participantIds = participants.map(p => p.id);
    }
    const sharePerPerson = participantIds.length > 0 ? amount / participantIds.length : 0;

    // Add this expense's share to each participant who was in this expense
    participantIds.forEach((pid: string) => {
      const currentShare = memberShares.get(pid) || 0;
      memberShares.set(pid, currentShare + sharePerPerson);
    });
  });

  const totalSpending = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const fairShare = participants.length > 0 ? totalSpending / participants.length : 0;

  return participants.map(p => {
    const fundContributed = fundContributions
      .filter((c: any) => c.participant_id === p.id)
      .reduce((acc: number, c: any) => acc + Number(c.amount), 0);

    const paidOnBehalf = expenses
      .filter((e: any) => e.payer_id === p.id)
      .reduce((acc: number, e: any) => acc + Number(e.amount), 0);

    const isTreasurer = p.id === treasurerId;
    const fairShareForMember = memberShares.get(p.id) || 0;
    const balance = Math.round(fundContributed + paidOnBehalf - fairShareForMember);

    return {
      id: p.id,
      name: p.name,
      initials: p.initials,
      colorClass: p.colorClass || p.color_class,
      avatarUrl: p.avatar_url,
      fundContributed,
      paidOnBehalf,
      fairShare: Math.round(fairShareForMember),
      balance,
      isTreasurer,
    };
  });
}

export function computePaymentPlan(balances: MemberBalance[], treasurerId: string): PaymentTransaction[] {
  const transactions: PaymentTransaction[] = [];

  // New logic: balance = fund - fairShare
  // Positive balance = gets refund from pool
  // Negative balance = owes money to pool

  const treasurer = balances.find(b => b.id === treasurerId) || balances[0];
  if (!treasurer) return [];

  for (const member of balances) {
    if (member.id === treasurer.id) continue;
    if (Math.abs(member.balance) < 1000) continue;

    if (member.balance < 0) {
      // Member owes money -> pays to treasurer/pool
      transactions.push({
        from: { id: member.id, name: member.name, initials: member.initials, avatarUrl: member.avatarUrl, colorClass: member.colorClass },
        to: { id: treasurer.id, name: treasurer.name, initials: treasurer.initials, avatarUrl: treasurer.avatarUrl, colorClass: treasurer.colorClass },
        amount: Math.abs(member.balance),
        type: 'pay', // from is paying
      });
    } else {
      // Member gets refund -> treasurer/pool pays back
      transactions.push({
        from: { id: treasurer.id, name: treasurer.name, initials: treasurer.initials, avatarUrl: treasurer.avatarUrl, colorClass: treasurer.colorClass },
        to: { id: member.id, name: member.name, initials: member.initials, avatarUrl: member.avatarUrl, colorClass: member.colorClass },
        amount: member.balance,
        type: 'receive', // from is receiving (treasurer refunding)
      });
    }
  }

  return transactions;
}

export function computeMemberExpenseDetails(
  memberId: string,
  participants: Participant[],
  expenses: any[]
): MemberExpenseDetail[] {
  return expenses
    .flatMap(e => {
      const amount = Number(e.amount);
      const expensePs = e.expense_participants || [];
      const participantIds = expensePs.length > 0
        ? expensePs.map((ep: any) => ep.participant_id)
        : participants.map(p => p.id);

      if (!participantIds.includes(memberId) || participantIds.length === 0) return [];

      return [{
        expenseId: e.id,
        reason: e.reason || 'Không có tên',
        category: e.category || 'Khác',
        amount,
        shareAmount: amount / participantIds.length,
        participantCount: participantIds.length,
        payerName: e.participants?.name || 'N/A',
        date: e.date || e.created_at || '',
      }];
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function computeCategoryBreakdown(expenses: any[]): CategorySpend[] {
  const map = new Map<string, number>();
  expenses.forEach(e => {
    const cat = e.category || 'Khác';
    map.set(cat, (map.get(cat) || 0) + Number(e.amount));
  });

  const total = [...map.values()].reduce((a, b) => a + b, 0);

  return [...map.entries()]
    .map(([category, sum]) => ({
      category,
      total: sum,
      percentage: total > 0 ? (sum / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || 'bg-gray-400',
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeStats(
  expenses: any[],
  fundContributions: any[],
  participantCount: number
): SettlementStats {
  const biggest = expenses.length > 0
    ? expenses.reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max, expenses[0])
    : null;

  const contributorTotals = new Map<string, number>();
  fundContributions.forEach(c => {
    const name = c.participants?.name || '';
    contributorTotals.set(name, (contributorTotals.get(name) || 0) + Number(c.amount));
  });
  const topContributor = [...contributorTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const categories = computeCategoryBreakdown(expenses);

  return {
    biggestExpense: {
      reason: biggest?.reason || 'N/A',
      amount: Number(biggest?.amount || 0),
      payerName: biggest?.participants?.name || 'N/A',
    },
    topContributor: { name: topContributor?.[0] || 'N/A', amount: topContributor?.[1] || 0 },
    biggestCategory: { category: categories[0]?.category || 'N/A', amount: categories[0]?.total || 0 },
    averagePerPerson: participantCount > 0
      ? Math.round(expenses.reduce((a, e) => a + Number(e.amount), 0) / participantCount)
      : 0,
    transactionCount: expenses.length,
  };
}
