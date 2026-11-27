import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Booking,
  BookingStatus,
  Complaint,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  Membership,
  MembershipStatus,
  MembershipTier,
  PriorityLevel,
  ServicePackage,
} from '../types/carakate';
import {
  getInitialBookings,
  getInitialComplaints,
  getInitialMemberships,
  getInitialPackages,
} from '../data/seedData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEY = 'carakate_banda_aceh_v1';

interface StoredState {
  packages: ServicePackage[];
  memberships: Membership[];
  bookings: Booking[];
  complaints: Complaint[];
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

export interface CreateMembershipInput {
  fullName: string;
  phone: string;
  email: string;
  vehiclePlate: string;
  vehicleModel: string;
  tier: MembershipTier;
}

export interface CreateBookingInput {
  isMember: boolean;
  memberLookup?: string; // memberCode or vehiclePlate
  memberId?: string;
  customerName: string;
  phone: string;
  vehiclePlate: string;
  vehicleModel: string;
  serviceType: string;
  bookingDate: string;
  timeSlot: string;
  notes?: string;
}

export interface CreateComplaintInput {
  bookingCode?: string;
  memberCode?: string;
  customerName: string;
  phone: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  photoDataUrl?: string;
}

interface CarakateContextValue {
  packages: ServicePackage[];
  memberships: Membership[];
  bookings: Booking[];
  complaints: Complaint[];
  isSupabaseConnected: boolean;
  isSyncing: boolean;

  // Membership CRUD
  findMembership: (query: string) => Membership | undefined;
  createMembership: (input: CreateMembershipInput) => ActionResult<Membership>;
  updateMembership: (
    id: string,
    updates: Partial<Membership>
  ) => ActionResult<Membership>;
  renewMembership: (id: string) => ActionResult<Membership>;
  upgradeMembership: (
    id: string,
    newTier: MembershipTier
  ) => ActionResult<Membership>;
  deleteMembership: (id: string) => ActionResult;

  // Booking CRUD
  createBooking: (input: CreateBookingInput) => ActionResult<Booking>;
  updateBooking: (id: string, updates: Partial<Booking>) => ActionResult<Booking>;
  updateBookingStatus: (
    id: string,
    newStatus: BookingStatus
  ) => ActionResult<Booking>;
  rescheduleBooking: (
    id: string,
    bookingDate: string,
    timeSlot: string
  ) => ActionResult<Booking>;
  cancelBookingByCustomer: (id: string) => ActionResult<Booking>;
  deleteBooking: (id: string) => ActionResult;

  // Complaint CRUD
  createComplaint: (input: CreateComplaintInput) => ActionResult<Complaint>;
  updateComplaint: (
    id: string,
    updates: Partial<Complaint>
  ) => ActionResult<Complaint>;
  updateComplaintStatus: (
    id: string,
    status: ComplaintStatus,
    adminResolution?: string
  ) => ActionResult<Complaint>;
  deleteComplaint: (id: string) => ActionResult;

  // Service Package CRUD
  createPackage: (
    input: Omit<ServicePackage, 'id'>
  ) => ActionResult<ServicePackage>;
  updatePackage: (
    id: string,
    updates: Partial<ServicePackage>
  ) => ActionResult<ServicePackage>;
  deletePackage: (id: string) => ActionResult;

  // Utility
  resetDemoData: () => void;
}

const CarakateContext = createContext<CarakateContextValue | undefined>(
  undefined
);

// ==================== DB ROW MAPPERS ====================
type DbPackageRow = {
  id: string;
  name: string;
  price_monthly: number;
  exterior_quota: string;
  has_priority_queue: boolean;
  priority_level: PriorityLevel;
  has_interior_vacuum: boolean;
  detailing_per_month: number;
  description: string;
  badge_color: string;
  is_active: boolean;
};

type DbMembershipRow = {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email: string;
  vehicle_plate: string;
  vehicle_model: string;
  tier: MembershipTier;
  monthly_quota: number;
  remaining_quota: number;
  loyalty_points: number;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
};

type DbBookingRow = {
  id: string;
  booking_code: string;
  member_id: string | null;
  customer_name: string;
  phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  service_type: string;
  booking_date: string;
  time_slot: string;
  queue_priority: PriorityLevel;
  status: BookingStatus;
  notes: string | null;
  quota_deducted: boolean;
  created_at: string;
};

type DbComplaintRow = {
  id: string;
  ticket_code: string;
  booking_code: string | null;
  member_code: string | null;
  customer_name: string;
  phone: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  photo_data_url: string | null;
  status: ComplaintStatus;
  admin_resolution: string | null;
  created_at: string;
  updated_at: string;
};

const toPackageModel = (r: DbPackageRow): ServicePackage => ({
  id: r.id,
  name: r.name,
  priceMonthly: r.price_monthly,
  exteriorQuota:
    r.exterior_quota === 'UNLIMITED' ? 'UNLIMITED' : Number(r.exterior_quota),
  hasPriorityQueue: r.has_priority_queue,
  priorityLevel: r.priority_level,
  hasInteriorVacuum: r.has_interior_vacuum,
  detailingPerMonth: r.detailing_per_month,
  description: r.description,
  badgeColor: r.badge_color,
  isActive: r.is_active,
});

const toPackageRow = (p: ServicePackage): DbPackageRow => ({
  id: p.id,
  name: p.name,
  price_monthly: p.priceMonthly,
  exterior_quota: String(p.exteriorQuota),
  has_priority_queue: p.hasPriorityQueue,
  priority_level: p.priorityLevel,
  has_interior_vacuum: p.hasInteriorVacuum,
  detailing_per_month: p.detailingPerMonth,
  description: p.description,
  badge_color: p.badgeColor,
  is_active: p.isActive,
});

const toMembershipModel = (r: DbMembershipRow): Membership => ({
  id: r.id,
  memberCode: r.member_code,
  fullName: r.full_name,
  phone: r.phone,
  email: r.email,
  vehiclePlate: r.vehicle_plate,
  vehicleModel: r.vehicle_model,
  tier: r.tier,
  monthlyQuota: r.monthly_quota,
  remainingQuota: r.remaining_quota,
  loyaltyPoints: r.loyalty_points,
  status: r.status,
  startDate: r.start_date,
  endDate: r.end_date,
});

const toMembershipRow = (m: Membership): DbMembershipRow => ({
  id: m.id,
  member_code: m.memberCode,
  full_name: m.fullName,
  phone: m.phone,
  email: m.email,
  vehicle_plate: m.vehiclePlate,
  vehicle_model: m.vehicleModel,
  tier: m.tier,
  monthly_quota: m.monthlyQuota,
  remaining_quota: m.remainingQuota,
  loyalty_points: m.loyaltyPoints,
  status: m.status,
  start_date: m.startDate,
  end_date: m.endDate,
});

const toBookingModel = (r: DbBookingRow): Booking => ({
  id: r.id,
  bookingCode: r.booking_code,
  memberId: r.member_id ?? undefined,
  customerName: r.customer_name,
  phone: r.phone,
  vehiclePlate: r.vehicle_plate,
  vehicleModel: r.vehicle_model,
  serviceType: r.service_type,
  bookingDate: r.booking_date,
  timeSlot: r.time_slot,
  queuePriority: r.queue_priority,
  status: r.status,
  notes: r.notes ?? undefined,
  quotaDeducted: r.quota_deducted,
  createdAt: r.created_at,
});

const toBookingRow = (b: Booking): DbBookingRow => ({
  id: b.id,
  booking_code: b.bookingCode,
  member_id: b.memberId ?? null,
  customer_name: b.customerName,
  phone: b.phone,
  vehicle_plate: b.vehiclePlate,
  vehicle_model: b.vehicleModel,
  service_type: b.serviceType,
  booking_date: b.bookingDate,
  time_slot: b.timeSlot,
  queue_priority: b.queuePriority,
  status: b.status,
  notes: b.notes ?? null,
  quota_deducted: Boolean(b.quotaDeducted),
  created_at: b.createdAt,
});

const toComplaintModel = (r: DbComplaintRow): Complaint => ({
  id: r.id,
  ticketCode: r.ticket_code,
  bookingCode: r.booking_code ?? undefined,
  memberCode: r.member_code ?? undefined,
  customerName: r.customer_name,
  phone: r.phone,
  category: r.category,
  severity: r.severity,
  description: r.description,
  photoDataUrl: r.photo_data_url ?? undefined,
  status: r.status,
  adminResolution: r.admin_resolution ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toComplaintRow = (c: Complaint): DbComplaintRow => ({
  id: c.id,
  ticket_code: c.ticketCode,
  booking_code: c.bookingCode ?? null,
  member_code: c.memberCode ?? null,
  customer_name: c.customerName,
  phone: c.phone,
  category: c.category,
  severity: c.severity,
  description: c.description,
  photo_data_url: c.photoDataUrl ?? null,
  status: c.status,
  admin_resolution: c.adminResolution ?? null,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (
        Array.isArray(parsed.packages) &&
        Array.isArray(parsed.memberships) &&
        Array.isArray(parsed.bookings) &&
        Array.isArray(parsed.complaints)
      ) {
        return {
          packages: parsed.packages,
          memberships: parsed.memberships,
          bookings: parsed.bookings,
          complaints: parsed.complaints,
        };
      }
    }
  } catch {
    // Fallback to seed data if localStorage is unavailable or corrupted
  }
  return {
    packages: getInitialPackages(),
    memberships: getInitialMemberships(),
    bookings: getInitialBookings(),
    complaints: getInitialComplaints(),
  };
}

function getTierQuota(tier: MembershipTier, packages: ServicePackage[]): number {
  const pkg = packages.find(
    (p) => p.name.toUpperCase() === tier.toUpperCase()
  );
  if (pkg) {
    return pkg.exteriorQuota === 'UNLIMITED' ? 30 : pkg.exteriorQuota;
  }
  if (tier === 'GOLD') return 30;
  if (tier === 'SILVER') return 8;
  return 4;
}

function getTierPriority(tier?: MembershipTier): PriorityLevel {
  if (tier === 'GOLD') return 'TOP_PRIORITY';
  if (tier === 'SILVER') return 'PRIORITY';
  return 'NORMAL';
}

function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

export const CarakateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<StoredState>(() => loadInitialState());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(isSupabaseConfigured);

  // Cache state in localStorage as offline backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Initial fetch from Supabase on mount
  useEffect(() => {
    if (!supabase) {
      setIsSyncing(false);
      return;
    }

    const client = supabase;
    let cancelled = false;
    const syncFromSupabase = async () => {
      try {
        const [pkgRes, memRes, bkRes, cmpRes] = await Promise.all([
          client
            .from('service_packages')
            .select('*')
            .order('price_monthly', { ascending: true }),
          client
            .from('memberships')
            .select('*')
            .order('created_at', { ascending: false }),
          client
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false }),
          client
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        if (pkgRes.error || memRes.error || bkRes.error || cmpRes.error) {
          console.error('Supabase sync error:', {
            pkg: pkgRes.error,
            mem: memRes.error,
            bk: bkRes.error,
            cmp: cmpRes.error,
          });
          if (!cancelled) {
            setIsSupabaseConnected(false);
            setIsSyncing(false);
          }
          return;
        }

        if (!cancelled) {
          setState({
            packages: (pkgRes.data as DbPackageRow[]).map(toPackageModel),
            memberships: (memRes.data as DbMembershipRow[]).map(
              toMembershipModel
            ),
            bookings: (bkRes.data as DbBookingRow[]).map(toBookingModel),
            complaints: (cmpRes.data as DbComplaintRow[]).map(toComplaintModel),
          });
          setIsSupabaseConnected(true);
          setIsSyncing(false);
        }
      } catch (err) {
        console.error('Supabase fetch failed:', err);
        if (!cancelled) {
          setIsSupabaseConnected(false);
          setIsSyncing(false);
        }
      }
    };

    syncFromSupabase();
    return () => {
      cancelled = true;
    };
  }, []);

  const { packages, memberships, bookings, complaints } = state;

  const findMembership = (query: string): Membership | undefined => {
    const q = query.trim().toUpperCase();
    if (!q) return undefined;
    const compactQ = q.replace(/\s+/g, '');
    return memberships.find(
      (m) =>
        m.memberCode.toUpperCase() === q ||
        m.vehiclePlate.toUpperCase().replace(/\s+/g, '') === compactQ ||
        m.phone.replace(/\s+/g, '') === compactQ
    );
  };

  // ==================== MEMBERSHIP CRUD ====================
  const createMembership = (
    input: CreateMembershipInput
  ): ActionResult<Membership> => {
    const cleanPlate = normalizePlate(input.vehiclePlate);
    const existingActive = memberships.find(
      (m) =>
        m.vehiclePlate.replace(/\s+/g, '').toUpperCase() ===
          cleanPlate.replace(/\s+/g, '') && m.status === 'ACTIVE'
    );
    if (existingActive) {
      return {
        ok: false,
        message: `Plat nomor ${cleanPlate} sudah terdaftar pada member aktif (${existingActive.memberCode}).`,
      };
    }

    const year = new Date().getFullYear();
    const nextNum = memberships.length + 1;
    let memberCode = `CRK-${year}-${String(nextNum).padStart(3, '0')}`;
    let counter = nextNum;
    while (memberships.some((m) => m.memberCode === memberCode)) {
      counter += 1;
      memberCode = `CRK-${year}-${String(counter).padStart(3, '0')}`;
    }

    const quota = getTierQuota(input.tier, packages);
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    const newMember: Membership = {
      id: `mem-${Date.now()}`,
      memberCode,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      vehiclePlate: cleanPlate,
      vehicleModel: input.vehicleModel.trim(),
      tier: input.tier,
      monthlyQuota: quota,
      remainingQuota: quota,
      loyaltyPoints: 50,
      status: 'ACTIVE',
      startDate: now.toISOString(),
      endDate: end.toISOString(),
    };

    setState((prev) => ({
      ...prev,
      memberships: [newMember, ...prev.memberships],
    }));

    if (supabase) {
      void supabase
        .from('memberships')
        .insert(toMembershipRow(newMember))
        .then(({ error }) => {
          if (error) console.error('Supabase insert membership error:', error);
        });
    }

    return {
      ok: true,
      message: `Selamat bergabung! Member ${memberCode} aktif selama 30 hari (+50 poin awal).`,
      data: newMember,
    };
  };

  const updateMembership = (
    id: string,
    updates: Partial<Membership>
  ): ActionResult<Membership> => {
    const target = memberships.find((m) => m.id === id);
    if (!target) {
      return { ok: false, message: 'Data member tidak ditemukan.' };
    }
    const updated: Membership = {
      ...target,
      ...updates,
      vehiclePlate: updates.vehiclePlate
        ? normalizePlate(updates.vehiclePlate)
        : target.vehiclePlate,
    };
    setState((prev) => ({
      ...prev,
      memberships: prev.memberships.map((m) => (m.id === id ? updated : m)),
    }));

    if (supabase) {
      void supabase
        .from('memberships')
        .upsert(toMembershipRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase update membership error:', error);
        });
    }

    return {
      ok: true,
      message: `Data member ${updated.memberCode} berhasil diperbarui.`,
      data: updated,
    };
  };

  const renewMembership = (id: string): ActionResult<Membership> => {
    const target = memberships.find((m) => m.id === id);
    if (!target) {
      return { ok: false, message: 'Data member tidak ditemukan.' };
    }
    const now = new Date();
    const currentEnd = new Date(target.endDate);
    const baseDate = currentEnd > now ? currentEnd : now;
    const newEnd = new Date(baseDate);
    newEnd.setDate(newEnd.getDate() + 30);

    const freshQuota = getTierQuota(target.tier, packages);
    const updated: Membership = {
      ...target,
      status: 'ACTIVE',
      endDate: newEnd.toISOString(),
      monthlyQuota: freshQuota,
      remainingQuota: freshQuota,
      loyaltyPoints: target.loyaltyPoints + 50,
    };

    setState((prev) => ({
      ...prev,
      memberships: prev.memberships.map((m) => (m.id === id ? updated : m)),
    }));

    if (supabase) {
      void supabase
        .from('memberships')
        .upsert(toMembershipRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase renew membership error:', error);
        });
    }

    return {
      ok: true,
      message: `Membership ${updated.memberCode} diperpanjang +30 hari, kuota di-reset, dan +50 Poin Loyalitas!`,
      data: updated,
    };
  };

  const upgradeMembership = (
    id: string,
    newTier: MembershipTier
  ): ActionResult<Membership> => {
    const target = memberships.find((m) => m.id === id);
    if (!target) {
      return { ok: false, message: 'Data member tidak ditemukan.' };
    }
    if (target.tier === newTier) {
      return { ok: false, message: `Member sudah berada di paket ${newTier}.` };
    }
    const newQuota = getTierQuota(newTier, packages);
    const quotaDiff = Math.max(0, newQuota - target.monthlyQuota);
    const updated: Membership = {
      ...target,
      tier: newTier,
      monthlyQuota: newQuota,
      remainingQuota:
        newTier === 'GOLD'
          ? 30
          : Math.min(newQuota, target.remainingQuota + quotaDiff),
      loyaltyPoints: target.loyaltyPoints + 30,
    };

    setState((prev) => ({
      ...prev,
      memberships: prev.memberships.map((m) => (m.id === id ? updated : m)),
    }));

    if (supabase) {
      void supabase
        .from('memberships')
        .upsert(toMembershipRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase upgrade membership error:', error);
        });
    }

    return {
      ok: true,
      message: `Paket ${updated.memberCode} berhasil diubah ke ${newTier} (+30 Poin Bonus)!`,
      data: updated,
    };
  };

  const deleteMembership = (id: string): ActionResult => {
    const target = memberships.find((m) => m.id === id);
    if (!target) {
      return { ok: false, message: 'Data member tidak ditemukan.' };
    }
    setState((prev) => ({
      ...prev,
      memberships: prev.memberships.filter((m) => m.id !== id),
    }));

    if (supabase) {
      void supabase
        .from('memberships')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete membership error:', error);
        });
    }

    return {
      ok: true,
      message: `Data member ${target.memberCode} telah dihapus.`,
    };
  };

  // ==================== BOOKING CRUD ====================
  const createBooking = (input: CreateBookingInput): ActionResult<Booking> => {
    let linkedMember: Membership | undefined;

    if (input.isMember) {
      if (input.memberId) {
        linkedMember = memberships.find((m) => m.id === input.memberId);
      } else if (input.memberLookup) {
        linkedMember = findMembership(input.memberLookup);
      }

      if (!linkedMember) {
        return {
          ok: false,
          message:
            'Member tidak ditemukan. Periksa kembali Kode Member atau Plat Nomor Anda.',
        };
      }

      if (linkedMember.status !== 'ACTIVE') {
        return {
          ok: false,
          message: `Status membership ${linkedMember.memberCode} sedang ${linkedMember.status}. Silakan perpanjang terlebih dahulu.`,
        };
      }

      if (linkedMember.remainingQuota <= 0) {
        return {
          ok: false,
          message: `Kuota cuci bulan ini untuk ${linkedMember.memberCode} sudah habis (0 tersisa).`,
        };
      }

      // Gold fair-use policy: max 1 active/completed booking per same date
      if (linkedMember.tier === 'GOLD') {
        const sameDayGoldBooking = bookings.find(
          (b) =>
            b.memberId === linkedMember!.id &&
            b.bookingDate === input.bookingDate &&
            b.status !== 'CANCELLED'
        );
        if (sameDayGoldBooking) {
          return {
            ok: false,
            message: `Batas wajar paket Gold: maksimal 1x cuci per hari. Sudah ada jadwal aktif/selesai (${sameDayGoldBooking.bookingCode}) pada tanggal ${input.bookingDate}.`,
          };
        }
      }
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    let seq = bookings.length + 1;
    let bookingCode = `BK-${yy}${mm}-${String(seq).padStart(2, '0')}`;
    while (bookings.some((b) => b.bookingCode === bookingCode)) {
      seq += 1;
      bookingCode = `BK-${yy}${mm}-${String(seq).padStart(2, '0')}`;
    }

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingCode,
      memberId: linkedMember?.id,
      customerName: linkedMember
        ? linkedMember.fullName
        : input.customerName.trim(),
      phone: linkedMember ? linkedMember.phone : input.phone.trim(),
      vehiclePlate: normalizePlate(
        linkedMember ? linkedMember.vehiclePlate : input.vehiclePlate
      ),
      vehicleModel: linkedMember
        ? linkedMember.vehicleModel
        : input.vehicleModel.trim(),
      serviceType: input.serviceType,
      bookingDate: input.bookingDate,
      timeSlot: input.timeSlot,
      queuePriority: getTierPriority(linkedMember?.tier),
      status: 'PENDING',
      notes: input.notes?.trim() || undefined,
      createdAt: now.toISOString(),
      quotaDeducted: false,
    };

    setState((prev) => ({
      ...prev,
      bookings: [newBooking, ...prev.bookings],
    }));

    if (supabase) {
      void supabase
        .from('bookings')
        .insert(toBookingRow(newBooking))
        .then(({ error }) => {
          if (error) console.error('Supabase insert booking error:', error);
        });
    }

    return {
      ok: true,
      message: `Booking ${bookingCode} berhasil dibuat untuk ${newBooking.bookingDate} jam ${newBooking.timeSlot}!`,
      data: newBooking,
    };
  };

  const updateBooking = (
    id: string,
    updates: Partial<Booking>
  ): ActionResult<Booking> => {
    const target = bookings.find((b) => b.id === id);
    if (!target) {
      return { ok: false, message: 'Booking tidak ditemukan.' };
    }
    const updated: Booking = {
      ...target,
      ...updates,
      vehiclePlate: updates.vehiclePlate
        ? normalizePlate(updates.vehiclePlate)
        : target.vehiclePlate,
    };
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? updated : b)),
    }));

    if (supabase) {
      void supabase
        .from('bookings')
        .upsert(toBookingRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase update booking error:', error);
        });
    }

    return {
      ok: true,
      message: `Booking ${updated.bookingCode} berhasil diperbarui.`,
      data: updated,
    };
  };

  const updateBookingStatus = (
    id: string,
    newStatus: BookingStatus
  ): ActionResult<Booking> => {
    const target = bookings.find((b) => b.id === id);
    if (!target) {
      return { ok: false, message: 'Booking tidak ditemukan.' };
    }

    let quotaNote = '';
    let nextQuotaDeducted = Boolean(target.quotaDeducted);
    let updatedMemberships = memberships;
    let changedMember: Membership | null = null;

    if (target.memberId) {
      const member = memberships.find((m) => m.id === target.memberId);
      if (member) {
        const isLimitedQuota = member.tier !== 'GOLD';

        if (newStatus === 'COMPLETED' && !nextQuotaDeducted && isLimitedQuota) {
          const newRemaining = Math.max(0, member.remainingQuota - 1);
          changedMember = {
            ...member,
            remainingQuota: newRemaining,
            loyaltyPoints: member.loyaltyPoints + 15,
          };
          updatedMemberships = memberships.map((m) =>
            m.id === member.id ? changedMember! : m
          );
          nextQuotaDeducted = true;
          quotaNote = ` Kuota ${member.memberCode} terpotong 1 (sisa ${newRemaining}) & +15 Poin.`;
        } else if (
          newStatus === 'COMPLETED' &&
          !nextQuotaDeducted &&
          !isLimitedQuota
        ) {
          changedMember = {
            ...member,
            remainingQuota: Math.max(0, member.remainingQuota - 1),
            loyaltyPoints: member.loyaltyPoints + 20,
          };
          updatedMemberships = memberships.map((m) =>
            m.id === member.id ? changedMember! : m
          );
          nextQuotaDeducted = true;
          quotaNote = ` Slot harian Gold tercatat & +20 Poin Loyalitas ditambahkan.`;
        }

        if (newStatus === 'CANCELLED' && nextQuotaDeducted) {
          const refunded = Math.min(
            member.monthlyQuota,
            member.remainingQuota + 1
          );
          changedMember = { ...member, remainingQuota: refunded };
          updatedMemberships = memberships.map((m) =>
            m.id === member.id ? changedMember! : m
          );
          nextQuotaDeducted = false;
          quotaNote = ` Kuota ${member.memberCode} dikembalikan (+1, sisa ${refunded}).`;
        }
      }
    }

    const updatedBooking: Booking = {
      ...target,
      status: newStatus,
      quotaDeducted: nextQuotaDeducted,
    };

    setState((prev) => ({
      ...prev,
      memberships: updatedMemberships,
      bookings: prev.bookings.map((b) => (b.id === id ? updatedBooking : b)),
    }));

    if (supabase) {
      void supabase
        .from('bookings')
        .upsert(toBookingRow(updatedBooking))
        .then(({ error }) => {
          if (error) console.error('Supabase booking status error:', error);
        });
      if (changedMember) {
        void supabase
          .from('memberships')
          .upsert(toMembershipRow(changedMember))
          .then(({ error }) => {
            if (error) console.error('Supabase member quota sync error:', error);
          });
      }
    }

    return {
      ok: true,
      message: `Status booking ${updatedBooking.bookingCode} diubah ke ${newStatus}.${quotaNote}`,
      data: updatedBooking,
    };
  };

  const rescheduleBooking = (
    id: string,
    bookingDate: string,
    timeSlot: string
  ): ActionResult<Booking> => {
    const target = bookings.find((b) => b.id === id);
    if (!target) {
      return { ok: false, message: 'Booking tidak ditemukan.' };
    }
    if (target.status !== 'PENDING' && target.status !== 'CONFIRMED') {
      return {
        ok: false,
        message:
          'Jadwal ulang hanya diperbolehkan untuk booking berstatus PENDING atau CONFIRMED.',
      };
    }

    if (target.memberId && target.bookingDate !== bookingDate) {
      const member = memberships.find((m) => m.id === target.memberId);
      if (member && member.tier === 'GOLD') {
        const conflict = bookings.find(
          (b) =>
            b.id !== target.id &&
            b.memberId === member.id &&
            b.bookingDate === bookingDate &&
            b.status !== 'CANCELLED'
        );
        if (conflict) {
          return {
            ok: false,
            message: `Batas wajar Gold: sudah ada jadwal (${conflict.bookingCode}) pada tanggal ${bookingDate}.`,
          };
        }
      }
    }

    const updated: Booking = { ...target, bookingDate, timeSlot };
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? updated : b)),
    }));

    if (supabase) {
      void supabase
        .from('bookings')
        .upsert(toBookingRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase reschedule error:', error);
        });
    }

    return {
      ok: true,
      message: `Booking ${updated.bookingCode} dijadwalkan ulang ke ${bookingDate} pukul ${timeSlot}.`,
      data: updated,
    };
  };

  const cancelBookingByCustomer = (id: string): ActionResult<Booking> => {
    const target = bookings.find((b) => b.id === id);
    if (!target) {
      return { ok: false, message: 'Booking tidak ditemukan.' };
    }
    if (target.status !== 'PENDING' && target.status !== 'CONFIRMED') {
      return {
        ok: false,
        message:
          'Pembatalan mandiri hanya dapat dilakukan selama status masih PENDING atau CONFIRMED.',
      };
    }
    return updateBookingStatus(id, 'CANCELLED');
  };

  const deleteBooking = (id: string): ActionResult => {
    const target = bookings.find((b) => b.id === id);
    if (!target) {
      return { ok: false, message: 'Booking tidak ditemukan.' };
    }
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.filter((b) => b.id !== id),
    }));

    if (supabase) {
      void supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete booking error:', error);
        });
    }

    return {
      ok: true,
      message: `Booking ${target.bookingCode} berhasil dihapus.`,
    };
  };

  // ==================== COMPLAINT CRUD ====================
  const createComplaint = (
    input: CreateComplaintInput
  ): ActionResult<Complaint> => {
    const year = new Date().getFullYear();
    let seq = complaints.length + 1;
    let ticketCode = `CMP-${year}-${String(seq).padStart(3, '0')}`;
    while (complaints.some((c) => c.ticketCode === ticketCode)) {
      seq += 1;
      ticketCode = `CMP-${year}-${String(seq).padStart(3, '0')}`;
    }

    const nowIso = new Date().toISOString();
    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketCode,
      bookingCode: input.bookingCode?.trim().toUpperCase() || undefined,
      memberCode: input.memberCode?.trim().toUpperCase() || undefined,
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      category: input.category,
      severity: input.severity,
      description: input.description.trim(),
      photoDataUrl: input.photoDataUrl,
      status: 'OPEN',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setState((prev) => ({
      ...prev,
      complaints: [newComplaint, ...prev.complaints],
    }));

    if (supabase) {
      void supabase
        .from('complaints')
        .insert(toComplaintRow(newComplaint))
        .then(({ error }) => {
          if (error) console.error('Supabase insert complaint error:', error);
        });
    }

    return {
      ok: true,
      message: `Tiket komplain ${ticketCode} berhasil dibuat. Tim kami akan segera menindaklanjuti.`,
      data: newComplaint,
    };
  };

  const updateComplaint = (
    id: string,
    updates: Partial<Complaint>
  ): ActionResult<Complaint> => {
    const target = complaints.find((c) => c.id === id);
    if (!target) {
      return { ok: false, message: 'Tiket komplain tidak ditemukan.' };
    }
    const updated: Complaint = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      complaints: prev.complaints.map((c) => (c.id === id ? updated : c)),
    }));

    if (supabase) {
      void supabase
        .from('complaints')
        .upsert(toComplaintRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase update complaint error:', error);
        });
    }

    return {
      ok: true,
      message: `Tiket ${updated.ticketCode} berhasil diperbarui.`,
      data: updated,
    };
  };

  const updateComplaintStatus = (
    id: string,
    status: ComplaintStatus,
    adminResolution?: string
  ): ActionResult<Complaint> => {
    const target = complaints.find((c) => c.id === id);
    if (!target) {
      return { ok: false, message: 'Tiket komplain tidak ditemukan.' };
    }
    const finalResolution =
      adminResolution !== undefined
        ? adminResolution.trim()
        : target.adminResolution;

    if (
      (status === 'RESOLVED' || status === 'CLOSED') &&
      (!finalResolution || finalResolution.length < 5)
    ) {
      return {
        ok: false,
        message:
          'Wajib mengisi catatan resolusi/kompensasi minimal 5 karakter sebelum menyelesaikan tiket.',
      };
    }

    const updated: Complaint = {
      ...target,
      status,
      adminResolution: finalResolution,
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      complaints: prev.complaints.map((c) => (c.id === id ? updated : c)),
    }));

    if (supabase) {
      void supabase
        .from('complaints')
        .upsert(toComplaintRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase complaint status error:', error);
        });
    }

    return {
      ok: true,
      message: `Status tiket ${updated.ticketCode} diperbarui menjadi ${status}.`,
      data: updated,
    };
  };

  const deleteComplaint = (id: string): ActionResult => {
    const target = complaints.find((c) => c.id === id);
    if (!target) {
      return { ok: false, message: 'Tiket komplain tidak ditemukan.' };
    }
    setState((prev) => ({
      ...prev,
      complaints: prev.complaints.filter((c) => c.id !== id),
    }));

    if (supabase) {
      void supabase
        .from('complaints')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete complaint error:', error);
        });
    }

    return {
      ok: true,
      message: `Tiket komplain ${target.ticketCode} telah dihapus.`,
    };
  };

  // ==================== SERVICE PACKAGE CRUD ====================
  const createPackage = (
    input: Omit<ServicePackage, 'id'>
  ): ActionResult<ServicePackage> => {
    const newPkg: ServicePackage = {
      ...input,
      id: `pkg-${Date.now()}`,
      name: input.name.trim(),
      description: input.description.trim(),
    };
    setState((prev) => ({
      ...prev,
      packages: [...prev.packages, newPkg],
    }));

    if (supabase) {
      void supabase
        .from('service_packages')
        .insert(toPackageRow(newPkg))
        .then(({ error }) => {
          if (error) console.error('Supabase insert package error:', error);
        });
    }

    return {
      ok: true,
      message: `Paket layanan "${newPkg.name}" berhasil ditambahkan.`,
      data: newPkg,
    };
  };

  const updatePackage = (
    id: string,
    updates: Partial<ServicePackage>
  ): ActionResult<ServicePackage> => {
    const target = packages.find((p) => p.id === id);
    if (!target) {
      return { ok: false, message: 'Paket layanan tidak ditemukan.' };
    }
    const updated: ServicePackage = { ...target, ...updates };
    setState((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => (p.id === id ? updated : p)),
    }));

    if (supabase) {
      void supabase
        .from('service_packages')
        .upsert(toPackageRow(updated))
        .then(({ error }) => {
          if (error) console.error('Supabase update package error:', error);
        });
    }

    return {
      ok: true,
      message: `Paket "${updated.name}" berhasil diperbarui.`,
      data: updated,
    };
  };

  const deletePackage = (id: string): ActionResult => {
    const target = packages.find((p) => p.id === id);
    if (!target) {
      return { ok: false, message: 'Paket layanan tidak ditemukan.' };
    }
    setState((prev) => ({
      ...prev,
      packages: prev.packages.filter((p) => p.id !== id),
    }));

    if (supabase) {
      void supabase
        .from('service_packages')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete package error:', error);
        });
    }

    return {
      ok: true,
      message: `Paket "${target.name}" berhasil dihapus.`,
    };
  };

  const resetDemoData = () => {
    const fresh: StoredState = {
      packages: getInitialPackages(),
      memberships: getInitialMemberships(),
      bookings: getInitialBookings(),
      complaints: getInitialComplaints(),
    };
    setState(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }

    if (supabase) {
      const client = supabase;
      void (async () => {
        try {
          await client.from('bookings').delete().neq('id', '');
          await client.from('complaints').delete().neq('id', '');
          await client.from('memberships').delete().neq('id', '');
          await client.from('service_packages').delete().neq('id', '');

          await client
            .from('service_packages')
            .insert(fresh.packages.map(toPackageRow));
          await client
            .from('memberships')
            .insert(fresh.memberships.map(toMembershipRow));
          await client
            .from('bookings')
            .insert(fresh.bookings.map(toBookingRow));
          await client
            .from('complaints')
            .insert(fresh.complaints.map(toComplaintRow));
        } catch (err) {
          console.error('Supabase reset demo error:', err);
        }
      })();
    }
  };

  return (
    <CarakateContext.Provider
      value={{
        packages,
        memberships,
        bookings,
        complaints,
        isSupabaseConnected,
        isSyncing,
        findMembership,
        createMembership,
        updateMembership,
        renewMembership,
        upgradeMembership,
        deleteMembership,
        createBooking,
        updateBooking,
        updateBookingStatus,
        rescheduleBooking,
        cancelBookingByCustomer,
        deleteBooking,
        createComplaint,
        updateComplaint,
        updateComplaintStatus,
        deleteComplaint,
        createPackage,
        updatePackage,
        deletePackage,
        resetDemoData,
      }}
    >
      {children}
    </CarakateContext.Provider>
  );
};

export function useCarakate(): CarakateContextValue {
  const ctx = useContext(CarakateContext);
  if (!ctx) {
    throw new Error('useCarakate must be used within a CarakateProvider');
  }
  return ctx;
}
