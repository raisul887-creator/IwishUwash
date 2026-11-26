import {
  BookingStatus,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  MembershipStatus,
  MembershipTier,
  PriorityLevel,
} from '../types/carakate';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateID(isoOrYmd: string): string {
  if (!isoOrYmd) return '-';
  const date = new Date(isoOrYmd);
  if (Number.isNaN(date.getTime())) return isoOrYmd;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimeID(iso: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  TOP_PRIORITY: 3,
  PRIORITY: 2,
  NORMAL: 1,
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  TOP_PRIORITY: 'Prioritas Utama (Gold)',
  PRIORITY: 'Prioritas (Silver)',
  NORMAL: 'Reguler',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  IN_PROGRESS: 'Sedang Dicuci',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: 'Aktif',
  EXPIRED: 'Kedaluwarsa',
  SUSPENDED: 'Ditangguhkan',
};

export const TIER_LABELS: Record<MembershipTier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
};

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  CLEANLINESS: 'Kebersihan Hasil Cuci',
  QUEUE_DELAY: 'Keterlambatan Antrean',
  STAFF_SERVICE: 'Pelayanan Staf',
  VEHICLE_DAMAGE: 'Kerusakan Kendaraan',
  BILLING: 'Pembayaran & Paket',
  OTHER: 'Lainnya',
};

export const COMPLAINT_SEVERITY_LABELS: Record<ComplaintSeverity, string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi / Mendesak',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Terselesaikan',
  CLOSED: 'Ditutup',
};
