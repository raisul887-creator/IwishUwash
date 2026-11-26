import React from 'react';
import {
  BookingStatus,
  ComplaintSeverity,
  ComplaintStatus,
  MembershipStatus,
  MembershipTier,
  PriorityLevel,
} from '../types/carakate';
import {
  BOOKING_STATUS_LABELS,
  COMPLAINT_SEVERITY_LABELS,
  COMPLAINT_STATUS_LABELS,
  MEMBERSHIP_STATUS_LABELS,
  PRIORITY_LABELS,
  TIER_LABELS,
} from '../utils/format';

export const TierBadge: React.FC<{ tier: MembershipTier }> = ({ tier }) => {
  const cls =
    tier === 'GOLD'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : tier === 'SILVER'
      ? 'bg-slate-200 text-slate-800 border-slate-300'
      : 'bg-orange-100 text-orange-800 border-orange-300';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({
  priority,
}) => {
  const cls =
    priority === 'TOP_PRIORITY'
      ? 'bg-amber-500/15 text-amber-800 border-amber-400/50'
      : priority === 'PRIORITY'
      ? 'bg-cyan-500/15 text-cyan-800 border-cyan-400/50'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
};

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({
  status,
}) => {
  const cls: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
    IN_PROGRESS: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls[status]}`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
};

export const MembershipStatusBadge: React.FC<{ status: MembershipStatus }> = ({
  status,
}) => {
  const cls: Record<MembershipStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
    SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls[status]}`}
    >
      {MEMBERSHIP_STATUS_LABELS[status]}
    </span>
  );
};

export const ComplaintStatusBadge: React.FC<{ status: ComplaintStatus }> = ({
  status,
}) => {
  const cls: Record<ComplaintStatus, string> = {
    OPEN: 'bg-rose-50 text-rose-700 border-rose-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls[status]}`}
    >
      {COMPLAINT_STATUS_LABELS[status]}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: ComplaintSeverity }> = ({
  severity,
}) => {
  const cls: Record<ComplaintSeverity, string> = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    HIGH: 'bg-rose-100 text-rose-800 border-rose-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${cls[severity]}`}
    >
      {COMPLAINT_SEVERITY_LABELS[severity]}
    </span>
  );
};
