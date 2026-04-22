import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Share2, Wallet, Receipt, PiggyBank, ShieldCheck,
  TrendingUp, TrendingDown, ArrowRight, Trophy, Utensils,
  Car, Gamepad2, Hotel, HelpCircle, BarChart3, CheckCircle2,
  Loader2, User, LayoutGrid, CreditCard, ArrowLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getSettlementPayments, setSettlementPayments } from '../lib/supabase';
import {
  computeMemberBalances, computeMemberExpenseDetails, computePaymentPlan,
  computeCategoryBreakdown, computeStats,
} from './settlement/computeSettlement';
import type { MemberBalance, MemberExpenseDetail, PaymentTransaction } from './settlement/computeSettlement';
import type { Participant } from '../types';

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

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  expenses: any[];
  fundContributions: any[];
  treasurerId: string;
}

export default function SettlementModal({
  isOpen, onClose, participants, expenses, fundContributions, treasurerId
}: SettlementModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
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
          const local = localStorage.getItem('settlement_modal_payments_done');
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
    try { localStorage.setItem('settlement_modal_payments_done', JSON.stringify(next)); } catch { }
  };

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

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 shrink-0 bg-surface-container">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-primary font-bold hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Quay lại</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 pb-20">
          {/* Hero Banner */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative h-28 sm:h-36 rounded-[2rem] overflow-hidden mb-6 shadow-lg"
          >
            <img
              src="/images/background.png"
              alt="Settlement Banner"
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 z-10">
              <h1 className="text-xl sm:text-3xl font-black text-white font-headline tracking-tighter mb-1">
                Quyết toán Chuyến đi
              </h1>
              <p className="text-white/80 text-xs">
                Tổng kết lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date().toLocaleDateString('vi-VN')}
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
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryCard icon={<Wallet size={14} className="text-primary" />} label="Tổng Quỹ" value={totalFund} borderColor="border-primary" />
                <SummaryCard icon={<Receipt size={14} className="text-tertiary" />} label="Tổng Thực chi" value={totalSpending} borderColor="border-tertiary" />
                <SummaryCard
                  icon={<PiggyBank size={14} className={remaining < 0 ? 'text-red-500' : remaining > totalFund * 0.3 ? 'text-emerald-500' : 'text-[#8b7e3d]'} />}
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
                  <h2 className="text-base font-black font-headline mb-3">Phân loại chi phí</h2>
                  <div className="bg-surface-container-lowest rounded-[2rem] p-4 sm:p-6 shadow-sm border border-outline-variant/10 space-y-4">
                    {categoryBreakdown.map(cat => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-on-surface-variant">{CATEGORY_ICONS[cat.category] || <HelpCircle size={14} />}</span>
                            {cat.category}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primary">{formatCurrency(cat.total)}đ</span>
                            <span className="text-[9px] font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                              {cat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-black font-headline">Chi tiết thành viên</h2>
                </div>
                <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[16.5%]" />
                        <col className="w-[16.5%]" />
                        <col className="w-[16.5%]" />
                        <col className="w-[16.5%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-surface-container-high/50">
                          <th className="px-4 py-2.5 text-[9px] font-black text-secondary uppercase tracking-widest text-left align-middle">Thành viên</th>
                          <th className="px-4 py-2.5 text-[9px] font-black text-secondary uppercase tracking-widest text-right align-middle">Đóng quỹ</th>
                          <th className="px-4 py-2.5 text-[9px] font-black text-secondary uppercase tracking-widest text-right align-middle">Chi hộ</th>
                          <th className="px-4 py-2.5 text-[9px] font-black text-secondary uppercase tracking-widest text-right align-middle">Tổng chi</th>
                          <th className="px-4 py-2.5 text-[9px] font-black text-secondary uppercase tracking-widest text-right align-middle">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {memberBalances.map(m => (
                          <tr key={m.id} className="hover:bg-surface-container-low transition-colors align-middle">
                            <td className="px-4 py-3 align-middle">
                              <div className="flex items-center gap-2 min-w-0">
                                <AvatarBubble initials={m.initials} colorClass={m.colorClass} avatarUrl={m.avatarUrl} size="sm" />
                                <div className="flex min-w-0 flex-col">
                                  <span className="text-xs font-bold truncate">{m.name}</span>
                                  {m.isTreasurer && (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-0.5">
                                      <ShieldCheck size={9} /> Thủ quỹ
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-medium whitespace-nowrap align-middle">{formatCurrency(m.fundContributed)}đ</td>
                            <td className="px-4 py-3 text-right text-xs font-medium text-tertiary whitespace-nowrap align-middle">{formatCurrency(m.paidOnBehalf)}đ</td>
                            <td className="px-4 py-3 text-right text-xs font-medium text-on-surface-variant whitespace-nowrap align-middle">
                              <button
                                type="button"
                                onClick={() => setSelectedMemberDetails({ member: m, details: memberExpenseDetails[m.id] || [] })}
                                className="font-medium text-on-surface-variant hover:text-primary hover:underline"
                              >
                                {formatCurrency(m.fairShare)}đ
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right align-middle">
                              <span className={cn(
                                'text-xs font-bold flex items-center justify-end gap-1 whitespace-nowrap',
                                m.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                              )}>
                                {m.balance >= 0 ? '+' : ''}{formatCurrency(m.balance)}đ
                                {m.balance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Quick Stats removed */}
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-base font-black font-headline mb-3">Kế hoạch thanh toán</h2>
              {paymentPlan.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-[2rem] p-8 text-center shadow-sm border border-outline-variant/10">
                  <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500" />
                  <p className="text-base font-bold text-emerald-600">Tất cả đã cân bằng!</p>
                  <p className="text-xs text-on-surface-variant mt-1">Không cần thanh toán thêm.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
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
                          'bg-surface-container-lowest rounded-2xl p-3 sm:p-4 shadow-sm border border-outline-variant/10 flex items-center gap-3 sm:gap-4 transition-opacity',
                          'border-l-4 border-l-red-400',
                          done && 'opacity-50'
                        )}
                      >
                        <button
                          onClick={() => togglePaymentDone(payKey)}
                          className={cn(
                            'shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                            done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-outline-variant/40 hover:border-primary'
                          )}
                        >
                          {done && <CheckCircle2 size={14} />}
                        </button>

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <AvatarBubble initials={tx.from.initials} colorClass={tx.from.colorClass} avatarUrl={tx.from.avatarUrl} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate">{tx.from.name}</span>
                            <span className={tx.type === 'pay' ? 'text-[8px] font-black uppercase tracking-widest text-red-400' : 'text-[8px] font-black uppercase tracking-widest text-emerald-500'}>
                              {tx.type === 'pay' ? 'Nộp thêm' : 'Hoàn trả'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center shrink-0">
                          <ArrowRight size={16} className="text-on-surface-variant mb-0.5" />
                          <span className="text-sm font-black text-primary whitespace-nowrap">
                            {done ? <s>{formatCurrency(tx.amount)}đ</s> : `${formatCurrency(tx.amount)}đ`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <div className="flex flex-col min-w-0 items-end">
                            <span className="text-xs font-bold truncate">{tx.to.name}</span>
                          </div>
                          <AvatarBubble initials={tx.to.initials} colorClass={tx.to.colorClass} avatarUrl={tx.to.avatarUrl} size="sm" />
                        </div>
                      </motion.div>
                    );
                  })}

                  {paymentPlan.length > 0 && (
                    <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-outline-variant/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Tiến độ thanh toán</span>
                        <span className="text-xs font-black text-primary">
                          {paymentPlan.filter(tx => completedPayments[`${tx.from.id}-${tx.to.id}-${tx.amount}`]).length} / {paymentPlan.length}
                        </span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
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
        </div>

        <AnimatePresence>
          {selectedMemberDetails && (
            <MemberExpenseDetailsModal
              member={selectedMemberDetails.member}
              details={selectedMemberDetails.details}
              onClose={() => setSelectedMemberDetails(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Sub-components ── */

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
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-2xl border border-outline-variant/10"
      >
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 bg-surface-container">
          <div>
            <h3 className="text-base font-black font-headline">Chi tiết Tổng chi</h3>
            <p className="text-xs text-on-surface-variant mt-1">{member.name} · {formatCurrency(member.fairShare)}đ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(85vh-76px)]">
          {details.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-5 text-xs text-on-surface-variant">
              Chưa có khoản chi nào cho thành viên này.
            </div>
          ) : (
            details.map(detail => (
              <div key={detail.expenseId} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
                <div className="flex items-start justify-between gap-3">
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
                    <p className="text-[11px] font-bold text-on-surface-variant">Bạn chịu</p>
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

function SummaryCard({ icon, label, value, borderColor, valueColor, prefix }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  borderColor: string;
  valueColor?: string;
  prefix?: string;
}) {
  return (
    <div className={cn('bg-surface-container p-4 sm:p-5 rounded-[2rem] shadow-sm border-l-3', borderColor)}>
      <div className="flex items-center gap-1 mb-2">
        {icon}
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn('text-xl sm:text-2xl font-black font-headline whitespace-nowrap', valueColor || 'text-on-surface')}>
        {prefix || ''}{formatCurrency(value)} <span className="text-sm font-bold">đ</span>
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/10">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-base font-black text-on-surface font-headline">{value}</p>
      {sub && <p className="text-[10px] text-secondary font-medium mt-1 truncate">{sub}</p>}
    </div>
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