import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Wallet,
  CalendarClock,
  MessageSquareWarning,
  RotateCcw,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Package,
  Image as ImageIcon,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useCarakate } from '../context/CarakateContext';
import { useToast } from '../context/ToastContext';
import {
  Booking,
  BookingStatus,
  Complaint,
  ComplaintStatus,
  Membership,
  MembershipStatus,
  MembershipTier,
  PriorityLevel,
  SERVICE_TYPES,
  ServicePackage,
  TIME_SLOTS,
} from '../types/carakate';
import { getTodayYMD } from '../data/seedData';
import {
  BOOKING_STATUS_LABELS,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  formatDateID,
  formatDateTimeID,
  formatRupiah,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
} from '../utils/format';
import {
  BookingStatusBadge,
  ComplaintStatusBadge,
  MembershipStatusBadge,
  PriorityBadge,
  SeverityBadge,
  TierBadge,
} from '../components/StatusBadges';
import { Modal } from '../components/Modal';

type AdminTab = 'bookings' | 'memberships' | 'complaints' | 'packages';

export const AdminPage: React.FC = () => {
  const {
    packages,
    memberships,
    bookings,
    complaints,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    createMembership,
    updateMembership,
    renewMembership,
    deleteMembership,
    updateComplaintStatus,
    deleteComplaint,
    createPackage,
    updatePackage,
    deletePackage,
    resetDemoData,
  } = useCarakate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const todayStr = getTodayYMD();

  // ==================== KPI STATS ====================
  const stats = useMemo(() => {
    const activeMembers = memberships.filter((m) => m.status === 'ACTIVE');
    const priceByTier: Record<MembershipTier, number> = {
      BRONZE:
        packages.find((p) => p.name.toUpperCase() === 'BRONZE')?.priceMonthly ??
        150000,
      SILVER:
        packages.find((p) => p.name.toUpperCase() === 'SILVER')?.priceMonthly ??
        280000,
      GOLD:
        packages.find((p) => p.name.toUpperCase() === 'GOLD')?.priceMonthly ??
        450000,
    };
    const mrr = activeMembers.reduce(
      (sum, m) => sum + (priceByTier[m.tier] || 0),
      0
    );
    const todayBookings = bookings.filter(
      (b) => b.bookingDate === todayStr && b.status !== 'CANCELLED'
    ).length;
    const openComplaints = complaints.filter(
      (c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS'
    ).length;

    return {
      activeMembersCount: activeMembers.length,
      mrr,
      todayBookings,
      openComplaints,
    };
  }, [memberships, packages, bookings, complaints, todayStr]);

  // ==================== MODALS STATE ====================
  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bkForm, setBkForm] = useState({
    customerName: '',
    phone: '',
    vehiclePlate: '',
    vehicleModel: '',
    serviceType: SERVICE_TYPES[1] as string,
    bookingDate: todayStr,
    timeSlot: TIME_SLOTS[0] as string,
    queuePriority: 'NORMAL' as PriorityLevel,
    notes: '',
    memberId: '',
  });

  // Membership Modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Membership | null>(null);
  const [memForm, setMemForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    vehiclePlate: '',
    vehicleModel: '',
    tier: 'SILVER' as MembershipTier,
    monthlyQuota: 8,
    remainingQuota: 8,
    loyaltyPoints: 50,
    status: 'ACTIVE' as MembershipStatus,
  });

  // Complaint Resolution Modal
  const [complaintModal, setComplaintModal] = useState<Complaint | null>(null);
  const [cmpStatus, setCmpStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [cmpResolution, setCmpResolution] = useState('');

  // Package Modal
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: '',
    priceMonthly: 200000,
    isUnlimited: false,
    exteriorQuotaNum: 6,
    hasPriorityQueue: false,
    priorityLevel: 'NORMAL' as PriorityLevel,
    hasInteriorVacuum: false,
    detailingPerMonth: 0,
    description: '',
    badgeColor: '#0e7490',
    isActive: true,
  });

  const handleResetDemo = () => {
    if (
      !window.confirm(
        'Reset seluruh data (Membership, Booking, Komplain, Paket) kembali ke data demo awal Banda Aceh?'
      )
    ) {
      return;
    }
    resetDemoData();
    showToast(
      'info',
      'Data Demo Di-reset',
      'Seluruh data berhasil dikembalikan ke kondisi awal.'
    );
  };

  // ==================== FILTERED LISTS ====================
  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
        if (!q) return true;
        return (
          b.bookingCode.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.vehiclePlate.toLowerCase().includes(q) ||
          b.serviceType.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Priority: Gold > Silver > Bronze/Umum, then date desc, then timeSlot asc
        const prioDiff =
          PRIORITY_ORDER[b.queuePriority] - PRIORITY_ORDER[a.queuePriority];
        if (prioDiff !== 0) return prioDiff;
        const dateDiff = b.bookingDate.localeCompare(a.bookingDate);
        if (dateDiff !== 0) return dateDiff;
        return a.timeSlot.localeCompare(b.timeSlot);
      });
  }, [bookings, search, statusFilter]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memberships.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.memberCode.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        m.vehiclePlate.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q)
      );
    });
  }, [memberships, search, statusFilter]);

  const filteredComplaints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.ticketCode.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [complaints, search, statusFilter]);

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((p) => {
      if (statusFilter === 'ACTIVE' && !p.isActive) return false;
      if (statusFilter === 'INACTIVE' && p.isActive) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [packages, search, statusFilter]);

  // ==================== BOOKING HANDLERS ====================
  const openAddBooking = () => {
    setEditingBooking(null);
    setBkForm({
      customerName: '',
      phone: '',
      vehiclePlate: '',
      vehicleModel: '',
      serviceType: SERVICE_TYPES[1],
      bookingDate: todayStr,
      timeSlot: TIME_SLOTS[1],
      queuePriority: 'NORMAL',
      notes: '',
      memberId: '',
    });
    setBookingModalOpen(true);
  };

  const openEditBooking = (b: Booking) => {
    setEditingBooking(b);
    setBkForm({
      customerName: b.customerName,
      phone: b.phone,
      vehiclePlate: b.vehiclePlate,
      vehicleModel: b.vehicleModel,
      serviceType: b.serviceType,
      bookingDate: b.bookingDate,
      timeSlot: b.timeSlot,
      queuePriority: b.queuePriority,
      notes: b.notes || '',
      memberId: b.memberId || '',
    });
    setBookingModalOpen(true);
  };

  const saveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBooking) {
      const res = updateBooking(editingBooking.id, {
        customerName: bkForm.customerName,
        phone: bkForm.phone,
        vehiclePlate: bkForm.vehiclePlate,
        vehicleModel: bkForm.vehicleModel,
        serviceType: bkForm.serviceType,
        bookingDate: bkForm.bookingDate,
        timeSlot: bkForm.timeSlot,
        queuePriority: bkForm.queuePriority,
        notes: bkForm.notes || undefined,
      });
      showToast(res.ok ? 'success' : 'error', 'Update Booking', res.message);
      if (res.ok) setBookingModalOpen(false);
    } else {
      const res = createBooking({
        isMember: Boolean(bkForm.memberId),
        memberId: bkForm.memberId || undefined,
        customerName: bkForm.customerName,
        phone: bkForm.phone,
        vehiclePlate: bkForm.vehiclePlate,
        vehicleModel: bkForm.vehicleModel,
        serviceType: bkForm.serviceType,
        bookingDate: bkForm.bookingDate,
        timeSlot: bkForm.timeSlot,
        notes: bkForm.notes,
      });
      showToast(res.ok ? 'success' : 'error', 'Tambah Booking', res.message);
      if (res.ok) setBookingModalOpen(false);
    }
  };

  // ==================== MEMBERSHIP HANDLERS ====================
  const openAddMember = () => {
    setEditingMember(null);
    setMemForm({
      fullName: '',
      phone: '',
      email: '',
      vehiclePlate: '',
      vehicleModel: '',
      tier: 'SILVER',
      monthlyQuota: 8,
      remainingQuota: 8,
      loyaltyPoints: 50,
      status: 'ACTIVE',
    });
    setMemberModalOpen(true);
  };

  const openEditMember = (m: Membership) => {
    setEditingMember(m);
    setMemForm({
      fullName: m.fullName,
      phone: m.phone,
      email: m.email,
      vehiclePlate: m.vehiclePlate,
      vehicleModel: m.vehicleModel,
      tier: m.tier,
      monthlyQuota: m.monthlyQuota,
      remainingQuota: m.remainingQuota,
      loyaltyPoints: m.loyaltyPoints,
      status: m.status,
    });
    setMemberModalOpen(true);
  };

  const saveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      const res = updateMembership(editingMember.id, {
        fullName: memForm.fullName,
        phone: memForm.phone,
        email: memForm.email,
        vehiclePlate: memForm.vehiclePlate,
        vehicleModel: memForm.vehicleModel,
        tier: memForm.tier,
        monthlyQuota: Number(memForm.monthlyQuota),
        remainingQuota: Number(memForm.remainingQuota),
        loyaltyPoints: Number(memForm.loyaltyPoints),
        status: memForm.status,
      });
      showToast(res.ok ? 'success' : 'error', 'Update Member', res.message);
      if (res.ok) setMemberModalOpen(false);
    } else {
      const res = createMembership({
        fullName: memForm.fullName,
        phone: memForm.phone,
        email: memForm.email,
        vehiclePlate: memForm.vehiclePlate,
        vehicleModel: memForm.vehicleModel,
        tier: memForm.tier,
      });
      showToast(res.ok ? 'success' : 'error', 'Tambah Member', res.message);
      if (res.ok) setMemberModalOpen(false);
    }
  };

  // ==================== COMPLAINT HANDLERS ====================
  const openComplaintModal = (c: Complaint) => {
    setComplaintModal(c);
    setCmpStatus(c.status);
    setCmpResolution(c.adminResolution || '');
  };

  const saveComplaintResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintModal) return;
    const res = updateComplaintStatus(
      complaintModal.id,
      cmpStatus,
      cmpResolution
    );
    if (!res.ok) {
      showToast('error', 'Validasi Gagal', res.message);
      return;
    }
    showToast('success', 'Tiket Diperbarui', res.message);
    setComplaintModal(null);
  };

  // ==================== PACKAGE HANDLERS ====================
  const openAddPackage = () => {
    setEditingPkg(null);
    setPkgForm({
      name: '',
      priceMonthly: 200000,
      isUnlimited: false,
      exteriorQuotaNum: 6,
      hasPriorityQueue: false,
      priorityLevel: 'NORMAL',
      hasInteriorVacuum: true,
      detailingPerMonth: 0,
      description: '',
      badgeColor: '#0e7490',
      isActive: true,
    });
    setPkgModalOpen(true);
  };

  const openEditPackage = (p: ServicePackage) => {
    setEditingPkg(p);
    setPkgForm({
      name: p.name,
      priceMonthly: p.priceMonthly,
      isUnlimited: p.exteriorQuota === 'UNLIMITED',
      exteriorQuotaNum:
        p.exteriorQuota === 'UNLIMITED' ? 30 : p.exteriorQuota,
      hasPriorityQueue: p.hasPriorityQueue,
      priorityLevel: p.priorityLevel,
      hasInteriorVacuum: p.hasInteriorVacuum,
      detailingPerMonth: p.detailingPerMonth,
      description: p.description,
      badgeColor: p.badgeColor,
      isActive: p.isActive,
    });
    setPkgModalOpen(true);
  };

  const savePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<ServicePackage, 'id'> = {
      name: pkgForm.name,
      priceMonthly: Number(pkgForm.priceMonthly),
      exteriorQuota: pkgForm.isUnlimited
        ? 'UNLIMITED'
        : Number(pkgForm.exteriorQuotaNum),
      hasPriorityQueue: pkgForm.hasPriorityQueue,
      priorityLevel: pkgForm.priorityLevel,
      hasInteriorVacuum: pkgForm.hasInteriorVacuum,
      detailingPerMonth: Number(pkgForm.detailingPerMonth),
      description: pkgForm.description,
      badgeColor: pkgForm.badgeColor,
      isActive: pkgForm.isActive,
    };

    const res = editingPkg
      ? updatePackage(editingPkg.id, payload)
      : createPackage(payload);
    showToast(
      res.ok ? 'success' : 'error',
      editingPkg ? 'Update Paket' : 'Tambah Paket',
      res.message
    );
    if (res.ok) setPkgModalOpen(false);
  };

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearch('');
    setStatusFilter('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#0E7490]">
            <ShieldCheck className="h-4 w-4" />
            Admin Operations Panel
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dashboard Admin CRUD I wish U wash here
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola antrean prioritas, membership, komplain pelanggan, dan paket
            layanan secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors w-fit"
        >
          <RotateCcw className="h-4 w-4 text-amber-400" />
          Reset Data Demo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Member Aktif
            </p>
            <div className="h-9 w-9 rounded-xl bg-cyan-50 text-[#0E7490] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.activeMembersCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Dari total {memberships.length} member terdaftar
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimasi MRR Bulanan
            </p>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {formatRupiah(stats.mrr)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Recurring revenue member aktif
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Booking Hari Ini
            </p>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.todayBookings}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Jadwal aktif tanggal {todayStr}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Komplain Terbuka
            </p>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MessageSquareWarning className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-rose-600">
            {stats.openComplaints}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Status OPEN / IN_PROGRESS
          </p>
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-4 flex flex-wrap gap-2">
          {(
            [
              {
                id: 'bookings',
                label: `Bookings (${bookings.length})`,
                icon: CalendarClock,
              },
              {
                id: 'memberships',
                label: `Memberships (${memberships.length})`,
                icon: Users,
              },
              {
                id: 'complaints',
                label: `Complaints (${complaints.length})`,
                icon: MessageSquareWarning,
              },
              {
                id: 'packages',
                label: `Service Packages (${packages.length})`,
                icon: Package,
              },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-colors ${
                activeTab === id
                  ? 'bg-white text-[#0E7490] border-[#0E7490]'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search + Filter + Add Action */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode, nama, plat nomor..."
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-[#0E7490] outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white focus:border-[#0E7490] outline-none"
            >
              <option value="ALL">Semua Status</option>
              {activeTab === 'bookings' &&
                (
                  [
                    'PENDING',
                    'CONFIRMED',
                    'IN_PROGRESS',
                    'COMPLETED',
                    'CANCELLED',
                  ] as BookingStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATUS_LABELS[s]}
                  </option>
                ))}
              {activeTab === 'memberships' && (
                <>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </>
              )}
              {activeTab === 'complaints' &&
                (
                  ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as ComplaintStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {COMPLAINT_STATUS_LABELS[s]}
                  </option>
                ))}
              {activeTab === 'packages' && (
                <>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </>
              )}
            </select>
          </div>

          {activeTab === 'bookings' && (
            <button
              type="button"
              onClick={openAddBooking}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white px-4 py-2 text-sm font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Booking
            </button>
          )}
          {activeTab === 'memberships' && (
            <button
              type="button"
              onClick={openAddMember}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white px-4 py-2 text-sm font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Member
            </button>
          )}
          {activeTab === 'packages' && (
            <button
              type="button"
              onClick={openAddPackage}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white px-4 py-2 text-sm font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Paket
            </button>
          )}
        </div>

        {/* ==================== TAB 1: BOOKINGS ==================== */}
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Kode &amp; Prioritas</th>
                  <th className="px-4 py-3">Pelanggan &amp; Mobil</th>
                  <th className="px-4 py-3">Jadwal &amp; Layanan</th>
                  <th className="px-4 py-3">Status (Auto Kuota)</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      Tidak ada data booking.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-mono font-bold text-[#0E7490]">
                          {b.bookingCode}
                        </p>
                        <div className="mt-1">
                          <PriorityBadge priority={b.queuePriority} />
                        </div>
                        {b.quotaDeducted && (
                          <span className="mt-1 inline-block text-[11px] font-medium text-emerald-700">
                            ✓ Kuota terpotong
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-900">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-slate-500">{b.phone}</p>
                        <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                          {b.vehiclePlate}{' '}
                          <span className="font-sans font-normal text-slate-500">
                            ({b.vehicleModel})
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-800">
                          {b.bookingDate} • {b.timeSlot}
                        </p>
                        <p className="text-xs text-slate-600">
                          {b.serviceType}
                        </p>
                        {b.notes && (
                          <p className="text-xs text-slate-400 italic mt-0.5 max-w-xs truncate">
                            &ldquo;{b.notes}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1.5">
                          <BookingStatusBadge status={b.status} />
                          <select
                            value={b.status}
                            onChange={(e) => {
                              const res = updateBookingStatus(
                                b.id,
                                e.target.value as BookingStatus
                              );
                              showToast(
                                res.ok ? 'success' : 'error',
                                'Status Booking',
                                res.message
                              );
                            }}
                            className="block w-full rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white focus:border-[#0E7490] outline-none"
                          >
                            {(
                              [
                                'PENDING',
                                'CONFIRMED',
                                'IN_PROGRESS',
                                'COMPLETED',
                                'CANCELLED',
                              ] as BookingStatus[]
                            ).map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBooking(b)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-cyan-50 hover:text-[#0E7490]"
                            title="Edit Booking"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus booking ${b.bookingCode}?`
                                )
                              ) {
                                const res = deleteBooking(b.id);
                                showToast('info', 'Booking Dihapus', res.message);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== TAB 2: MEMBERSHIPS ==================== */}
        {activeTab === 'memberships' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Kendaraan</th>
                  <th className="px-4 py-3">Tier &amp; Kuota</th>
                  <th className="px-4 py-3">Status &amp; Masa Aktif</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      Tidak ada data member.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs font-bold text-[#0E7490]">
                          {m.memberCode}
                        </p>
                        <p className="font-semibold text-slate-900">
                          {m.fullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.phone} • {m.email}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-slate-800">
                          {m.vehiclePlate}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.vehicleModel}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <TierBadge tier={m.tier} />
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          Kuota: {m.remainingQuota}/{m.monthlyQuota}
                        </p>
                        <p className="text-xs text-amber-700 font-medium">
                          {m.loyaltyPoints} Poin
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <MembershipStatusBadge status={m.status} />
                        <p className="text-xs text-slate-500 mt-1">
                          s/d {formatDateID(m.endDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const res = renewMembership(m.id);
                              showToast(
                                res.ok ? 'success' : 'error',
                                'Perpanjang Member',
                                res.message
                              );
                            }}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Perpanjang +30 Hari"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditMember(m)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-cyan-50 hover:text-[#0E7490]"
                            title="Edit Member"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus data member ${m.memberCode} (${m.fullName})?`
                                )
                              ) {
                                const res = deleteMembership(m.id);
                                showToast('info', 'Member Dihapus', res.message);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== TAB 3: COMPLAINTS ==================== */}
        {activeTab === 'complaints' && (
          <div className="divide-y divide-slate-100">
            {filteredComplaints.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Tidak ada tiket komplain.
              </div>
            ) : (
              filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-slate-50/70"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0E7490]">
                        {c.ticketCode}
                      </span>
                      <ComplaintStatusBadge status={c.status} />
                      <SeverityBadge severity={c.severity} />
                      <span className="text-xs text-slate-500">
                        • {COMPLAINT_CATEGORY_LABELS[c.category]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {c.customerName}{' '}
                      <span className="font-normal text-slate-500">
                        ({c.phone})
                      </span>
                      {c.bookingCode && (
                        <span className="ml-2 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                          {c.bookingCode}
                        </span>
                      )}
                      {c.memberCode && (
                        <span className="ml-1 text-xs font-mono bg-cyan-50 text-[#0E7490] px-2 py-0.5 rounded">
                          {c.memberCode}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">
                      {c.description}
                    </p>
                    {c.photoDataUrl && (
                      <div className="pt-1">
                        <span className="text-xs text-slate-500 inline-flex items-center gap-1 mb-1">
                          <ImageIcon className="h-3.5 w-3.5" /> Foto Bukti:
                        </span>
                        <img
                          src={c.photoDataUrl}
                          alt={`Bukti ${c.ticketCode}`}
                          className="h-28 rounded-lg border border-slate-200 object-cover"
                        />
                      </div>
                    )}
                    {c.adminResolution && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
                        <strong>Resolusi Admin:</strong> {c.adminResolution}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Dibuat: {formatDateTimeID(c.createdAt)} • Diperbarui:{' '}
                      {formatDateTimeID(c.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openComplaintModal(c)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white px-3.5 py-2 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Tangani / Resolusi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Hapus tiket komplain ${c.ticketCode}?`
                          )
                        ) {
                          const res = deleteComplaint(c.id);
                          showToast('info', 'Tiket Dihapus', res.message);
                        }
                      }}
                      className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200"
                      title="Hapus Tiket"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== TAB 4: SERVICE PACKAGES ==================== */}
        {activeTab === 'packages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Harga / Bulan</th>
                  <th className="px-4 py-3">Kuota &amp; Fitur</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: p.badgeColor }}
                        />
                        <span className="font-bold text-slate-900">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xs">
                        {p.description}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#0E7490]">
                      {formatRupiah(p.priceMonthly)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 space-y-0.5">
                      <p>
                        Kuota:{' '}
                        <strong>
                          {p.exteriorQuota === 'UNLIMITED'
                            ? 'UNLIMITED (1x/hr)'
                            : `${p.exteriorQuota}x/bln`}
                        </strong>
                      </p>
                      <p>Antrean: {PRIORITY_LABELS[p.priorityLevel]}</p>
                      <p>
                        Vakum: {p.hasInteriorVacuum ? 'Ya' : 'Tidak'} •
                        Detailing: {p.detailingPerMonth}x/bln
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          const res = updatePackage(p.id, {
                            isActive: !p.isActive,
                          });
                          showToast('info', 'Status Paket', res.message);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {p.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {p.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditPackage(p)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-cyan-50 hover:text-[#0E7490]"
                          title="Edit Paket"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus paket "${p.name}"?`)) {
                              const res = deletePackage(p.id);
                              showToast('info', 'Paket Dihapus', res.message);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus Paket"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== MODAL: ADD/EDIT BOOKING ==================== */}
      <Modal
        open={bookingModalOpen}
        title={editingBooking ? 'Edit Jadwal Booking' : 'Tambah Booking Manual'}
        onClose={() => setBookingModalOpen(false)}
      >
        <form onSubmit={saveBooking} className="space-y-4">
          {!editingBooking && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Member (Opsional — kosongkan untuk Non-Member)
              </label>
              <select
                value={bkForm.memberId}
                onChange={(e) => {
                  const id = e.target.value;
                  const mem = memberships.find((m) => m.id === id);
                  setBkForm((prev) => ({
                    ...prev,
                    memberId: id,
                    customerName: mem ? mem.fullName : prev.customerName,
                    phone: mem ? mem.phone : prev.phone,
                    vehiclePlate: mem ? mem.vehiclePlate : prev.vehiclePlate,
                    vehicleModel: mem ? mem.vehicleModel : prev.vehicleModel,
                    serviceType: mem
                      ? 'Cuci Membership'
                      : 'Cuci Satuan Eksterior & Vakum',
                  }));
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">-- Non-Member / Cuci Satuan --</option>
                {memberships.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.memberCode} - {m.fullName} ({m.tier}, sisa{' '}
                    {m.remainingQuota})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelanggan *
              </label>
              <input
                type="text"
                required
                value={bkForm.customerName}
                onChange={(e) =>
                  setBkForm({ ...bkForm, customerName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. HP *
              </label>
              <input
                type="tel"
                required
                value={bkForm.phone}
                onChange={(e) =>
                  setBkForm({ ...bkForm, phone: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plat Nomor *
              </label>
              <input
                type="text"
                required
                value={bkForm.vehiclePlate}
                onChange={(e) =>
                  setBkForm({
                    ...bkForm,
                    vehiclePlate: e.target.value.toUpperCase(),
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Mobil *
              </label>
              <input
                type="text"
                required
                value={bkForm.vehicleModel}
                onChange={(e) =>
                  setBkForm({ ...bkForm, vehicleModel: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={bkForm.bookingDate}
                onChange={(e) =>
                  setBkForm({ ...bkForm, bookingDate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam *
              </label>
              <select
                value={bkForm.timeSlot}
                onChange={(e) =>
                  setBkForm({ ...bkForm, timeSlot: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Layanan
              </label>
              <select
                value={bkForm.serviceType}
                onChange={(e) =>
                  setBkForm({ ...bkForm, serviceType: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan
            </label>
            <input
              type="text"
              value={bkForm.notes}
              onChange={(e) => setBkForm({ ...bkForm, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E7490] hover:bg-cyan-700 px-5 py-2 text-sm font-bold text-white"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: ADD/EDIT MEMBER ==================== */}
      <Modal
        open={memberModalOpen}
        title={editingMember ? 'Edit Data Member' : 'Tambah Member Manual'}
        onClose={() => setMemberModalOpen(false)}
      >
        <form onSubmit={saveMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={memForm.fullName}
                onChange={(e) =>
                  setMemForm({ ...memForm, fullName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. HP *
              </label>
              <input
                type="tel"
                required
                value={memForm.phone}
                onChange={(e) =>
                  setMemForm({ ...memForm, phone: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={memForm.email}
              onChange={(e) =>
                setMemForm({ ...memForm, email: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plat Nomor *
              </label>
              <input
                type="text"
                required
                value={memForm.vehiclePlate}
                onChange={(e) =>
                  setMemForm({
                    ...memForm,
                    vehiclePlate: e.target.value.toUpperCase(),
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Mobil *
              </label>
              <input
                type="text"
                required
                value={memForm.vehicleModel}
                onChange={(e) =>
                  setMemForm({ ...memForm, vehicleModel: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tier Paket
              </label>
              <select
                value={memForm.tier}
                onChange={(e) => {
                  const t = e.target.value as MembershipTier;
                  const q = t === 'GOLD' ? 30 : t === 'SILVER' ? 8 : 4;
                  setMemForm({
                    ...memForm,
                    tier: t,
                    monthlyQuota: q,
                    remainingQuota: editingMember ? memForm.remainingQuota : q,
                  });
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="BRONZE">BRONZE</option>
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
              </select>
            </div>

            {editingMember && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={memForm.status}
                  onChange={(e) =>
                    setMemForm({
                      ...memForm,
                      status: e.target.value as MembershipStatus,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            )}
          </div>

          {editingMember && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kuota Bulanan
                </label>
                <input
                  type="number"
                  min={1}
                  value={memForm.monthlyQuota}
                  onChange={(e) =>
                    setMemForm({
                      ...memForm,
                      monthlyQuota: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sisa Kuota
                </label>
                <input
                  type="number"
                  min={0}
                  value={memForm.remainingQuota}
                  onChange={(e) =>
                    setMemForm({
                      ...memForm,
                      remainingQuota: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Poin Loyalitas
                </label>
                <input
                  type="number"
                  min={0}
                  value={memForm.loyaltyPoints}
                  onChange={(e) =>
                    setMemForm({
                      ...memForm,
                      loyaltyPoints: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMemberModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E7490] hover:bg-cyan-700 px-5 py-2 text-sm font-bold text-white"
            >
              Simpan Member
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: HANDLE COMPLAINT ==================== */}
      <Modal
        open={Boolean(complaintModal)}
        title="Penanganan Tiket Komplain"
        subtitle={
          complaintModal
            ? `${complaintModal.ticketCode} • ${complaintModal.customerName}`
            : undefined
        }
        onClose={() => setComplaintModal(null)}
      >
        <form onSubmit={saveComplaintResolution} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Penanganan
            </label>
            <select
              value={cmpStatus}
              onChange={(e) => setCmpStatus(e.target.value as ComplaintStatus)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {(
                ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as ComplaintStatus[]
              ).map((st) => (
                <option key={st} value={st}>
                  {st} — {COMPLAINT_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Resolusi / Kompensasi{' '}
              {(cmpStatus === 'RESOLVED' || cmpStatus === 'CLOSED') && (
                <span className="text-rose-600">* (Wajib diisi)</span>
              )}
            </label>
            <textarea
              rows={4}
              required={cmpStatus === 'RESOLVED' || cmpStatus === 'CLOSED'}
              value={cmpResolution}
              onChange={(e) => setCmpResolution(e.target.value)}
              placeholder="Tuliskan tindakan perbaikan, permintaan maaf, atau kompensasi yang diberikan..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setComplaintModal(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E7490] hover:bg-cyan-700 px-5 py-2 text-sm font-bold text-white"
            >
              Simpan Resolusi
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODAL: ADD/EDIT PACKAGE ==================== */}
      <Modal
        open={pkgModalOpen}
        title={editingPkg ? 'Edit Paket Layanan' : 'Tambah Paket Layanan'}
        onClose={() => setPkgModalOpen(false)}
      >
        <form onSubmit={savePackage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Paket *
              </label>
              <input
                type="text"
                required
                value={pkgForm.name}
                onChange={(e) =>
                  setPkgForm({ ...pkgForm, name: e.target.value })
                }
                placeholder="Mis. Platinum"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Bulanan (Rp) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={5000}
                value={pkgForm.priceMonthly}
                onChange={(e) =>
                  setPkgForm({
                    ...pkgForm,
                    priceMonthly: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={pkgForm.isUnlimited}
                  onChange={(e) =>
                    setPkgForm({ ...pkgForm, isUnlimited: e.target.checked })
                  }
                  className="rounded"
                />
                Kuota Unlimited (Maks. 1x/hari)
              </label>
              {!pkgForm.isUnlimited && (
                <input
                  type="number"
                  min={1}
                  value={pkgForm.exteriorQuotaNum}
                  onChange={(e) =>
                    setPkgForm({
                      ...pkgForm,
                      exteriorQuotaNum: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Jumlah kuota cuci/bln"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Level Prioritas
              </label>
              <select
                value={pkgForm.priorityLevel}
                onChange={(e) => {
                  const lvl = e.target.value as PriorityLevel;
                  setPkgForm({
                    ...pkgForm,
                    priorityLevel: lvl,
                    hasPriorityQueue: lvl !== 'NORMAL',
                  });
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="PRIORITY">PRIORITY</option>
                <option value="TOP_PRIORITY">TOP_PRIORITY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailing / Bulan
              </label>
              <input
                type="number"
                min={0}
                value={pkgForm.detailingPerMonth}
                onChange={(e) =>
                  setPkgForm({
                    ...pkgForm,
                    detailingPerMonth: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warna Badge
              </label>
              <input
                type="color"
                value={pkgForm.badgeColor}
                onChange={(e) =>
                  setPkgForm({ ...pkgForm, badgeColor: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-slate-300 p-1"
              />
            </div>

            <div className="space-y-1.5 pt-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={pkgForm.hasInteriorVacuum}
                  onChange={(e) =>
                    setPkgForm({
                      ...pkgForm,
                      hasInteriorVacuum: e.target.checked,
                    })
                  }
                />
                Vakum Interior
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={pkgForm.isActive}
                  onChange={(e) =>
                    setPkgForm({ ...pkgForm, isActive: e.target.checked })
                  }
                />
                Paket Aktif
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Paket *
            </label>
            <textarea
              rows={2}
              required
              value={pkgForm.description}
              onChange={(e) =>
                setPkgForm({ ...pkgForm, description: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPkgModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E7490] hover:bg-cyan-700 px-5 py-2 text-sm font-bold text-white"
            >
              Simpan Paket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
