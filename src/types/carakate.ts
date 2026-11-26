export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'TOP_PRIORITY';

export type MembershipTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ComplaintCategory =
  | 'CLEANLINESS'
  | 'QUEUE_DELAY'
  | 'STAFF_SERVICE'
  | 'VEHICLE_DAMAGE'
  | 'BILLING'
  | 'OTHER';

export type ComplaintSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ServicePackage {
  id: string;
  name: 'Bronze' | 'Silver' | 'Gold' | string;
  priceMonthly: number;
  exteriorQuota: number | 'UNLIMITED';
  hasPriorityQueue: boolean;
  priorityLevel: PriorityLevel;
  hasInteriorVacuum: boolean;
  detailingPerMonth: number;
  description: string;
  badgeColor: string;
  isActive: boolean;
}

export interface Membership {
  id: string;
  memberCode: string; // contoh: 'CRK-2026-001'
  fullName: string;
  phone: string;
  email: string;
  vehiclePlate: string;
  vehicleModel: string;
  tier: MembershipTier;
  monthlyQuota: number; // untuk Gold set 30 (batas wajar maks 1x/hari)
  remainingQuota: number;
  loyaltyPoints: number;
  status: MembershipStatus;
  startDate: string; // ISO date
  endDate: string; // ISO date
}

export interface Booking {
  id: string;
  bookingCode: string; // contoh: 'BK-2611-01'
  memberId?: string;
  customerName: string;
  phone: string;
  vehiclePlate: string;
  vehicleModel: string;
  serviceType: string; // 'Cuci Membership' | 'Cuci Satuan Eksterior & Vakum' | 'Detailing Berkala'
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string; // contoh: '09:00', '10:30', '13:30', '15:00', '16:30'
  queuePriority: PriorityLevel;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  quotaDeducted?: boolean;
}

export interface Complaint {
  id: string;
  ticketCode: string; // contoh: 'CMP-2026-001'
  bookingCode?: string;
  memberCode?: string;
  customerName: string;
  phone: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  photoDataUrl?: string; // upload gambar preview base64
  status: ComplaintStatus;
  adminResolution?: string;
  createdAt: string;
  updatedAt: string;
}

export const TIME_SLOTS = [
  '08:30',
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '15:00',
  '16:30',
  '18:00',
] as const;

export const SERVICE_TYPES = [
  'Cuci Membership',
  'Cuci Satuan Eksterior & Vakum',
  'Detailing Berkala',
] as const;
