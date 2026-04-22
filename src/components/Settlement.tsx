import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, Share2, Wallet, Receipt, PiggyBank, ShieldCheck,
  TrendingUp, TrendingDown, ArrowRight, Trophy, Utensils,
  Car, Gamepad2, Hotel, HelpCircle, BarChart3, CheckCircle2,
  Loader2, User, CircleDot, LayoutGrid, Users, CreditCard,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useParticipants } from './ParticipantContext';
import { getExpenses, getFundContributions, getSettlementPayments, setSettlementPayments } from '../lib/supabase';
import {
  computeMemberBalances, computeMemberExpenseDetails, computePaymentPlan,
  computeCategoryBreakdown, computeStats,
} from './settlement/computeSettlement';
import type { MemberBalance, MemberExpenseDetail, PaymentTransaction } from './settlement/computeSettlement';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Ẩm thực': <Utensils size={16} />,
  'Di chuyển': <Car size={16} />,
  'Giải trí': <Gamepad2 size={16} />,
  'Lưu trú': <Hotel size={16} />,
  'Khác': <HelpCircle size={16} />,
};

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: <LayoutGrid size={18} /> },
  { key: 'payments', label: 'Thanh toán', icon: <CreditCard size={18} /> },
] as const;

type TabKey = typeof TABS[number]['key'];

const formatCurrency = (n: number) => Math.round(n).toLocaleString('vi-VN');

function AvatarBubble({ initials, colorClass, avatarUrl, size = 'md' }: {
  initials: string; colorClass: string; avatarUrl?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const s = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs';
  return avatarUrl ? (
    <img src={avatarUrl} alt="" className={cn('rounded-full object-cover shadow-sm', s)} />
  ) : (
    <div className={cn('rounded-full flex items-center justify-center font-bold shadow-sm', s, colorClass)}>
      {initials}
    </div>
  );
}

export default function Settlement() {
  const location = useLocation();
  const navigate = useNavigate();
  const { participants, treasurerId, loading: participantsLoading } = useParticipants();

  const stateData = (location.state as any) || null;
  const [expenses, setExpenses] = useState<any[]>(stateData?.expenses ?? []);
  const [fundContributions, setFundContributions] = useState<any[]>(stateData?.fundContributions ?? []);
  const [loading, setLoading] = useState(!stateData);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<{ member: MemberBalance; details: MemberExpenseDetail[] } | null>(null);

  // Track payment completion state (persisted in database)
  const [completedPayments, setCompletedPayments] = useState<Record<string, boolean>>({});

  // Load payments from database on mount
  useEffect(() => {
    const loadPayments = async () => {
      try {
        const payments = await getSettlementPayments();
        setCompletedPayments(payments);
      } catch (error) {
        console.error('Error loading settlement payments from DB:', error);
        // Fallback to localStorage
        try {
          const local = localStorage.getItem('settlement_payments_done');
          setCompletedPayments(local ? JSON.parse(local) : {});
        } catch { }
      }
    };
    loadPayments();
  }, []);

  const togglePaymentDone = async (key: string) => {
    const next = { ...completedPayments, [key]: !completedPayments[key] };
    setCompletedPayments(next);
    // Save to database
    try {
      await setSettlementPayments(next);
    } catch (error) {
      console.error('Error saving settlement payments to DB:', error);
    }
    // Also save to localStorage as fallback
    try { localStorage.setItem('settlement_payments_done', JSON.stringify(next)); } catch { }
  };

  // Fallback: fetch if no state passed (direct URL access)
  useEffect(() => {
    if (!stateData) {
      const fetch = async () => {
        try {
          const [e, f] = await Promise.all([getExpenses(), getFundContributions()]);
          setExpenses(e);
          setFundContributions(f);
        } catch (err) {
          console.error('Failed to fetch settlement data:', err);
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }
  }, [stateData]);

  const totalFund = useMemo(() => fundContributions.reduce((a, c) => a + Number(c.amount), 0), [fundContributions]);
  const totalSpending = useMemo(() => expenses.reduce((a, e) => a + Number(e.amount), 0), [expenses]);
  const remaining = totalFund - totalSpending;

  const memberBalances = useMemo(
    () => computeMemberBalances(participants, expenses, fundContributions, treasurerId),
    [participants, expenses, fundContributions, treasurerId]
  );
  const paymentPlan = useMemo(() => computePaymentPlan(memberBalances, treasurerId), [memberBalances, treasurerId]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(expenses), [expenses]);
  const memberExpenseDetails = useMemo(
    () => Object.fromEntries(memberBalances.map(member => [member.id, computeMemberExpenseDetails(member.id, participants, expenses)])),
    [memberBalances, participants, expenses]
  );
  const stats = useMemo(
    () => computeStats(expenses, fundContributions, participants.length),
    [expenses, fundContributions, participants.length]
  );

  const sharePerPerson = memberBalances.length > 0
    ? memberBalances.reduce((sum, m) => sum + m.fairShare, 0) / memberBalances.length
    : 0;

  const handleShare = async () => {
    const text = buildShareText(memberBalances, paymentPlan, totalFund, totalSpending, remaining, sharePerPerson);
    if (navigator.share) {
      try { await navigator.share({ title: 'Quyết toán Phú Quý Escape', text }); return; } catch { }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || participantsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-secondary">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold">Đang tải dữ liệu quyết toán...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-28">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative h-36 sm:h-48 rounded-[2rem] sm:rounded-[3rem] overflow-hidden mb-6 shadow-lg"
      >
        <img
          src="/images/background.png"
          alt="Settlement Banner"
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 z-10">
          <h1 className="text-2xl sm:text-4xl font-black text-white font-headline tracking-tighter mb-1">
            Quyết toán Chuyến đi
          </h1>
          <p className="text-white/80 text-xs sm:text-sm">
            Tổng kết lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} &middot; {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
      </motion.section>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-surface-container-low rounded-2xl p-1.5 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all flex-1 justify-center',
              activeTab === tab.key
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-secondary hover:bg-surface-container hover:text-primary'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard icon={<Wallet size={16} className="text-primary" />} label="Tổng Quỹ" value={totalFund} borderColor="border-primary" />
            <SummaryCard icon={<Receipt size={16} className="text-tertiary" />} label="Tổng Thực chi" value={totalSpending} borderColor="border-tertiary" />
            <SummaryCard
              icon={<PiggyBank size={16} className={remaining < 0 ? 'text-red-500' : remaining > totalFund * 0.3 ? 'text-emerald-500' : 'text-[#8b7e3d]'} />}
              label="Số dư"
              value={remaining}
              borderColor={remaining < 0 ? 'border-red-500' : remaining > totalFund * 0.3 ? 'border-emerald-500' : 'border-[#8b7e3d]'}
              valueColor={remaining < 0 ? 'text-red-600' : remaining > totalFund * 0.3 ? 'text-emerald-600' : 'text-[#8b7e3d]'}
              prefix={remaining >= 0 ? '+' : ''}
            />
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div>
              <h2 className="text-lg font-black font-headline mb-4">Phân loại chi phí</h2>
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 sm:p-8 shadow-sm border border-outline-variant/10 space-y-5">
                {categoryBreakdown.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-on-surface-variant">{CATEGORY_ICONS[cat.category] || <HelpCircle size={16} />}</span>
                        {cat.category}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-primary">{formatCurrency(cat.total)}đ</span>
                        <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-lg">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', cat.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-member Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black font-headline">Chi tiết thành viên</h2>
            </div>
            <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[16.5%]" />
                    <col className="w-[16.5%]" />
                    <col className="w-[16.5%]" />
                    <col className="w-[16.5%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-surface-container-high/50">
                      <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-left align-middle">Thành viên</th>
                      <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right align-middle">Đóng quỹ</th>
                      <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right align-middle">Chi hộ</th>
                      <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right align-middle">Tổng chi</th>
                      <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right align-middle">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {memberBalances.map(m => (
                      <tr key={m.id} className="hover:bg-surface-container-low transition-colors align-middle">
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <AvatarBubble initials={m.initials} colorClass={m.colorClass} avatarUrl={m.avatarUrl} size="sm" />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-bold text-sm">{m.name}</span>
                              {m.isTreasurer && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-0.5">
                                  <ShieldCheck size={10} /> Thủ quỹ
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-medium whitespace-nowrap align-middle">{formatCurrency(m.fundContributed)}đ</td>
                        <td className="px-5 py-4 text-right text-sm font-medium text-tertiary whitespace-nowrap align-middle">{formatCurrency(m.paidOnBehalf)}đ</td>
                        <td className="px-5 py-4 text-right text-sm font-medium text-on-surface-variant whitespace-nowrap align-middle">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberDetails({ member: m, details: memberExpenseDetails[m.id] || [] })}
                            className="font-medium text-on-surface-variant hover:text-primary hover:underline"
                          >
                            {formatCurrency(m.fairShare)}đ
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right align-middle">
                          <span className={cn(
                            'font-bold text-sm flex items-center justify-end gap-1 whitespace-nowrap',
                            m.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            {m.balance >= 0 ? '+' : ''}{formatCurrency(m.balance)}đ
                            {m.balance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Stats removed by request */}
        </motion.div>
      )}

      {activeTab === 'payments' && (
        <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-black font-headline mb-4">Kế hoạch thanh toán</h2>
          {paymentPlan.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-[2rem] p-10 text-center shadow-sm border border-outline-variant/10">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-600">Tất cả đã cân bằng!</p>
              <p className="text-sm text-on-surface-variant mt-1">Không cần thanh toán thêm.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentPlan.map((tx, i) => {
                const payKey = `${tx.from.id}-${tx.to.id}-${tx.amount}`;
                const done = !!completedPayments[payKey];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/10 flex items-center gap-3 sm:gap-5 transition-opacity',
                      'border-l-4 border-l-red-400',
                      done && 'opacity-50'
                    )}
                  >
                    <button
                      onClick={() => togglePaymentDone(payKey)}
                      className={cn(
                        'shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all',
                        done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-outline-variant/40 hover:border-primary'
                      )}
                    >
                      {done && <CheckCircle2 size={16} />}
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AvatarBubble initials={tx.from.initials} colorClass={tx.from.colorClass} avatarUrl={tx.from.avatarUrl} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate">{tx.from.name}</span>
                        <div className="flex items-center gap-1">
                          <span className={tx.type === 'pay' ? 'text-[10px] font-black uppercase tracking-widest text-red-400' : 'text-[10px] font-black uppercase tracking-widest text-emerald-500'}>
                            {tx.type === 'pay' ? 'Nộp thêm' : 'Hoàn trả'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <ArrowRight size={18} className="text-on-surface-variant mb-0.5" />
                      <span className="text-sm sm:text-base font-black text-primary whitespace-nowrap">
                        {done ? <s>{formatCurrency(tx.amount)}đ</s> : `${formatCurrency(tx.amount)}đ`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <div className="flex flex-col min-w-0 items-end">
                        <span className="font-bold text-sm truncate">{tx.to.name}</span>
                      </div>
                      <AvatarBubble initials={tx.to.initials} colorClass={tx.to.colorClass} avatarUrl={tx.to.avatarUrl} size="sm" />
                    </div>
                  </motion.div>
                );
              })}

              {paymentPlan.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tiến độ thanh toán</span>
                    <span className="text-sm font-black text-primary">
                      {paymentPlan.filter(tx => completedPayments[`${tx.from.id}-${tx.to.id}-${tx.amount}`]).length} / {paymentPlan.length}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(paymentPlan.filter(tx => completedPayments[`${tx.from.id}-${tx.to.id}-${tx.amount}`]).length / paymentPlan.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedMemberDetails && (
          <MemberExpenseDetailsModal
            member={selectedMemberDetails.member}
            details={selectedMemberDetails.details}
            onClose={() => setSelectedMemberDetails(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({ icon, label, value, borderColor, valueColor, prefix }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  borderColor: string;
  valueColor?: string;
  prefix?: string;
}) {
  return (
    <div className={cn('bg-surface-container p-6 sm:p-8 rounded-[2rem] shadow-sm border-l-4', borderColor)}>
      <div className="flex items-center gap-1.5 mb-4">
        {icon}
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn('text-2xl sm:text-3xl font-black font-headline whitespace-nowrap', valueColor || 'text-on-surface')}>
        {prefix || ''}{formatCurrency(value)} <span className="text-base font-bold">đ</span>
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black text-on-surface font-headline">{value}</p>
      {sub && <p className="text-xs text-secondary font-medium mt-1 truncate">{sub}</p>}
    </div>
  );
}

function MemberExpenseDetailsModal({
  member,
  details,
  onClose,
}: {
  member: MemberBalance;
  details: MemberExpenseDetail[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-2xl border border-outline-variant/10"
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10 bg-surface-container">
          <div>
            <h3 className="text-lg font-black font-headline">Chi tiết Tổng chi</h3>
            <p className="text-sm text-on-surface-variant mt-1">{member.name} · {formatCurrency(member.fairShare)}đ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto max-h-[calc(85vh-84px)]">
          {details.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6 text-sm text-on-surface-variant">
              Chưa có khoản chi nào cho thành viên này.
            </div>
          ) : (
            details.map(detail => (
              <div key={detail.expenseId} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-on-surface">{detail.reason}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-on-surface-variant font-medium">
                      <span>{detail.category}</span>
                      <span>•</span>
                      <span>Người chi: {detail.payerName}</span>
                      <span>•</span>
                      <span>{detail.participantCount} người</span>
                    </div>
                    {detail.date && (
                      <p className="mt-1 text-[11px] text-on-surface-variant">{new Date(detail.date).toLocaleString('vi-VN')}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-on-surface-variant">Bạn chịu</p>
                    <p className="text-sm font-black text-primary">{formatCurrency(detail.shareAmount)}đ</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">Tổng bill {formatCurrency(detail.amount)}đ</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function buildShareText(
  members: MemberBalance[],
  payments: PaymentTransaction[],
  totalFund: number,
  totalSpending: number,
  remaining: number,
  sharePerPerson: number,
): string {
  const lines: string[] = [
    '=== QUYẾT TOÁN VŨNG TÀU ESCAPE ===',
    `Tổng quỹ: ${formatCurrency(totalFund)}đ`,
    `Tổng chi: ${formatCurrency(totalSpending)}đ`,
    `Số dư: ${formatCurrency(remaining)}đ`,
    `Bình quân: ${formatCurrency(sharePerPerson)}đ/người`,
    '',
    '--- KẾ HOẠCH THANH TOÁN ---',
  ];
  if (payments.length === 0) {
    lines.push('Tất cả đã cân bằng!');
  } else {
    payments.forEach(tx => {
      lines.push(`${tx.from.name} → ${tx.to.name}: ${formatCurrency(tx.amount)}đ`);
    });
  }
  lines.push('', `Cập nhật: ${new Date().toLocaleString('vi-VN')}`);
  return lines.join('\n');
}
