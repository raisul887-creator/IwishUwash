import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Booking,
  BookingStatus,
  Complaint,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  Membership,
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

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

    if (target.memberId) {
      const member = memberships.find((m) => m.id === target.memberId);
      if (member) {
        const isLimitedQuota = member.tier !== 'GOLD';

        // Deduct quota when moving to COMPLETED for limited-quota members
        if (
          newStatus === 'COMPLETED' &&
          !nextQuotaDeducted &&
          isLimitedQuota
        ) {
          const newRemaining = Math.max(0, member.remainingQuota - 1);
          updatedMemberships = memberships.map((m) =>
            m.id === member.id
              ? {
                  ...m,
                  remainingQuota: newRemaining,
                  loyaltyPoints: m.loyaltyPoints + 15,
                }
              : m
          );
          nextQuotaDeducted = true;
          quotaNote = ` Kuota ${member.memberCode} terpotong 1 (sisa ${newRemaining}) & +15 Poin.`;
        } else if (newStatus === 'COMPLETED' && !isLimitedQuota) {
          // Gold member gets loyalty points on completion without limited-quota penalty
          updatedMemberships = memberships.map((m) =>
            m.id === member.id
              ? {
                  ...m,
                  remainingQuota: Math.max(0, m.remainingQuota - 1),
                  loyaltyPoints: m.loyaltyPoints + 20,
                }
              : m
          );
          nextQuotaDeducted = true;
          quotaNote = ` Slot harian Gold tercatat & +20 Poin Loyalitas ditambahkan.`;
        }

        // Refund quota if cancelled (or reverted) after previously deducted
        if (newStatus === 'CANCELLED' && nextQuotaDeducted) {
          const refunded = Math.min(
            member.monthlyQuota,
            member.remainingQuota + 1
          );
          updatedMemberships = memberships.map((m) =>
            m.id === member.id ? { ...m, remainingQuota: refunded } : m
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

    // Check Gold 1x/day rule if date changed
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
  };

  return (
    <CarakateContext.Provider
      value={{
        packages,
        memberships,
        bookings,
        complaints,
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
