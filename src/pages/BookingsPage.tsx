import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Crown,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Car,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useCarakate } from '../context/CarakateContext';
import { useToast } from '../context/ToastContext';
import { Booking, SERVICE_TYPES, TIME_SLOTS } from '../types/carakate';
import { getTodayYMD } from '../data/seedData';
import { PRIORITY_ORDER } from '../utils/format';
import {
  BookingStatusBadge,
  PriorityBadge,
  TierBadge,
} from '../components/StatusBadges';
import { Modal } from '../components/Modal';

export const BookingsPage: React.FC = () => {
  const {
    bookings,
    findMembership,
    createBooking,
    rescheduleBooking,
    cancelBookingByCustomer,
  } = useCarakate();
  const { showToast } = useToast();

  const todayStr = getTodayYMD();

  // Booking mode
  const [isMemberMode, setIsMemberMode] = useState(true);
  const [memberLookup, setMemberLookup] = useState('');
  const [verifiedMemberId, setVerifiedMemberId] = useState<string | null>(null);

  // Non-member fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // Shared booking fields
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0]);
  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[2]);
  const [notes, setNotes] = useState('');

  // Tracking & History search
  const [searchQuery, setSearchQuery] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState(todayStr);
  const [newSlot, setNewSlot] = useState<string>(TIME_SLOTS[0]);

  const verifiedMember = useMemo(
    () => (memberLookup.trim() ? findMembership(memberLookup) : undefined),
    [memberLookup, findMembership]
  );

  const handleVerifyMember = () => {
    const match = findMembership(memberLookup);
    if (!match) {
      setVerifiedMemberId(null);
      showToast(
        'error',
        'Member tidak ditemukan',
        'Pastikan Kode Member atau Plat Nomor benar.'
      );
      return;
    }
    setVerifiedMemberId(match.id);
    showToast(
      'info',
      `Member Terverifikasi: ${match.fullName}`,
      `Tier ${match.tier} • Sisa kuota ${match.remainingQuota}/${match.monthlyQuota}`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isMemberMode) {
      if (!memberLookup.trim()) {
        showToast(
          'error',
          'Kode Member wajib diisi',
          'Masukkan Kode Member atau Plat Nomor Anda.'
        );
        return;
      }
    } else {
      if (
        !customerName.trim() ||
        !phone.trim() ||
        !vehiclePlate.trim() ||
        !vehicleModel.trim()
      ) {
        showToast(
          'error',
          'Data belum lengkap',
          'Lengkapi nama, no. HP, plat nomor, dan model kendaraan.'
        );
        return;
      }
    }

    const res = createBooking({
      isMember: isMemberMode,
      memberLookup: isMemberMode ? memberLookup : undefined,
      memberId: isMemberMode ? verifiedMemberId ?? undefined : undefined,
      customerName,
      phone,
      vehiclePlate,
      vehicleModel,
      serviceType: isMemberMode
        ? serviceType
        : serviceType === 'Cuci Membership'
        ? 'Cuci Satuan Eksterior & Vakum'
        : serviceType,
      bookingDate,
      timeSlot,
      notes,
    });

    if (!res.ok) {
      showToast('error', 'Validasi Booking Gagal', res.message);
      return;
    }

    showToast('success', 'Booking Berhasil Dibuat!', res.message);
    if (res.data) {
      setSearchQuery(res.data.bookingCode);
    }
    setNotes('');
    if (!isMemberMode) {
      setCustomerName('');
      setPhone('');
      setVehiclePlate('');
      setVehicleModel('');
    }
  };

  // Today's queue sorted by priority Gold > Silver > Normal, then timeSlot
  const todayQueue = useMemo(() => {
    return bookings
      .filter((b) => b.bookingDate === todayStr && b.status !== 'CANCELLED')
      .sort((a, b) => {
        const prioDiff =
          PRIORITY_ORDER[b.queuePriority] - PRIORITY_ORDER[a.queuePriority];
        if (prioDiff !== 0) return prioDiff;
        return a.timeSlot.localeCompare(b.timeSlot);
      });
  }, [bookings, todayStr]);

  // Search history by bookingCode or vehiclePlate or customerName
  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? bookings.filter(
          (b) =>
            b.bookingCode.toLowerCase().includes(q) ||
            b.vehiclePlate.toLowerCase().includes(q) ||
            b.customerName.toLowerCase().includes(q)
        )
      : bookings;
    return [...list].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [bookings, searchQuery]);

  const openRescheduleModal = (b: Booking) => {
    setRescheduleTarget(b);
    setNewDate(b.bookingDate);
    setNewSlot(b.timeSlot);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    const res = rescheduleBooking(rescheduleTarget.id, newDate, newSlot);
    if (!res.ok) {
      showToast('error', 'Gagal Jadwal Ulang', res.message);
      return;
    }
    showToast('success', 'Jadwal Diperbarui', res.message);
    setRescheduleTarget(null);
  };

  const handleCancelBooking = (b: Booking) => {
    if (
      !window.confirm(
        `Batalkan booking ${b.bookingCode} (${b.vehiclePlate}) pada ${b.bookingDate} jam ${b.timeSlot}?`
      )
    ) {
      return;
    }
    const res = cancelBookingByCustomer(b.id);
    if (!res.ok) {
      showToast('error', 'Gagal Membatalkan', res.message);
      return;
    }
    showToast('info', 'Booking Dibatalkan', res.message);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#0E7490]">
          <CalendarClock className="h-4 w-4" />
          Booking Terjadwal Banda Aceh
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Booking Jadwal Cuci &amp; Antrean Hari Ini
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
          Pesan slot waktu sesuai jadwal Anda. Antrean otomatis diprioritaskan
          berdasarkan tier membership (Gold &gt; Silver &gt; Reguler).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: BOOKING FORM */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 m-5 mb-0 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setIsMemberMode(true);
                setServiceType('Cuci Membership');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                isMemberMode
                  ? 'bg-[#0E7490] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="h-4 w-4 text-amber-300" />
              Mode Member
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMemberMode(false);
                setServiceType('Cuci Satuan Eksterior & Vakum');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                !isMemberMode
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-4 w-4" />
              Non-Member / Satuan
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {isMemberMode ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Kode Member atau Plat Nomor *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberLookup}
                    onChange={(e) => {
                      setMemberLookup(e.target.value);
                      setVerifiedMemberId(null);
                    }}
                    placeholder="Contoh: CRK-2026-001 atau BL 8821 A"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono uppercase focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyMember}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition-colors"
                  >
                    Cek Member
                  </button>
                </div>

                {/* Quick sample buttons */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="text-slate-500 py-0.5">Contoh cepat:</span>
                  {['CRK-2026-001', 'CRK-2026-002', 'CRK-2026-003'].map(
                    (code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setMemberLookup(code)}
                        className="rounded-md bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-[#0E7490] px-2 py-0.5 font-mono transition-colors"
                      >
                        {code}
                      </button>
                    )
                  )}
                </div>

                {/* Live Member Validation Card */}
                {verifiedMember ? (
                  <div
                    className={`rounded-xl p-4 border text-xs space-y-1.5 ${
                      verifiedMember.status === 'ACTIVE' &&
                      verifiedMember.remainingQuota > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        {verifiedMember.status === 'ACTIVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                        )}
                        {verifiedMember.fullName}
                      </span>
                      <TierBadge tier={verifiedMember.tier} />
                    </div>
                    <p>
                      Kendaraan: <strong>{verifiedMember.vehiclePlate}</strong>{' '}
                      — {verifiedMember.vehicleModel}
                    </p>
                    <p>
                      Status: <strong>{verifiedMember.status}</strong> • Sisa
                      Kuota:{' '}
                      <strong>
                        {verifiedMember.remainingQuota}/
                        {verifiedMember.monthlyQuota}
                      </strong>
                      {verifiedMember.tier === 'GOLD' &&
                        ' (Batas wajar maks. 1x/hari)'}
                    </p>
                  </div>
                ) : (
                  memberLookup.trim().length >= 5 && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      Member belum ditemukan. Periksa ejaan kode/plat atau pilih
                      mode Non-Member.
                    </p>
                  )
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Pelanggan *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      No. WhatsApp / HP *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Plat Nomor *
                    </label>
                    <input
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={(e) =>
                        setVehiclePlate(e.target.value.toUpperCase())
                      }
                      placeholder="BL 4321 AA"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono uppercase focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Model Mobil *
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Toyota Innova Zenix Hitam"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Service, Date, TimeSlot */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Layanan *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
              >
                {SERVICE_TYPES.filter((s) =>
                  isMemberMode ? true : s !== 'Cuci Membership'
                ).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Cuci *
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  min={todayStr}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih Slot Jam *
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} WIB
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mis. fokus bersihkan kolong lumpur atau karpet belakang..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white font-bold py-3 px-4 text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CalendarClock className="h-4 w-4" />
              Konfirmasi Booking Jadwal
            </button>
          </form>
        </div>

        {/* RIGHT: ANTREAN HARI INI */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">
                  Antrean &amp; Jadwal Hari Ini
                </h2>
                <p className="text-xs text-slate-300">
                  Tanggal {todayStr} • Diurutkan: Gold &gt; Silver &gt; Reguler
                </p>
              </div>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-3 py-1 text-xs font-bold text-cyan-300">
                {todayQueue.length} Mobil
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {todayQueue.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Belum ada jadwal aktif untuk hari ini. Jadilah yang pertama!
                </div>
              ) : (
                todayQueue.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {b.vehiclePlate}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({b.bookingCode})
                          </span>
                          <PriorityBadge priority={b.queuePriority} />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {b.customerName} • {b.vehicleModel}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#0E7490]">
                            <Clock className="h-3.5 w-3.5" />
                            {b.timeSlot} WIB
                          </span>
                          <span>• {b.serviceType}</span>
                        </p>
                      </div>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LACAK & RIWAYAT BOOKING (RESCHEDULE / CANCEL) */}
      <section
        id="lacak"
        className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-[#0E7490]" />
              Lacak Status &amp; Kelola Booking Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cari berdasarkan Kode Booking, Plat Nomor, atau Nama. Anda dapat
              menjadwal ulang atau membatalkan selama status masih PENDING /
              CONFIRMED.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari BK-2611-01 atau BL 1420 AA..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Tidak ada riwayat booking yang cocok dengan pencarian Anda.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const canModify =
                b.status === 'PENDING' || b.status === 'CONFIRMED';
              return (
                <div
                  key={b.id}
                  className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0E7490]">
                        {b.bookingCode}
                      </span>
                      <BookingStatusBadge status={b.status} />
                      <PriorityBadge priority={b.queuePriority} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-800">
                      <span className="font-semibold">{b.customerName}</span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                        <Car className="h-3.5 w-3.5 text-slate-500" />
                        {b.vehiclePlate}
                      </span>
                      <span className="text-xs text-slate-500">
                        {b.vehicleModel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {b.bookingDate} • {b.timeSlot} WIB
                      </span>
                      <span>Layanan: {b.serviceType}</span>
                    </div>
                    {b.notes && (
                      <p className="text-xs text-slate-500 italic">
                        Catatan: &ldquo;{b.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canModify ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openRescheduleModal(b)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-[#0E7490] border border-cyan-200 px-3.5 py-2 text-xs font-bold transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Jadwal Ulang
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 text-xs font-bold transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Batalkan
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Jadwal terkunci ({b.status})
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Reschedule Modal */}
      <Modal
        open={Boolean(rescheduleTarget)}
        title="Jadwalkan Ulang Booking"
        subtitle={
          rescheduleTarget
            ? `${rescheduleTarget.bookingCode} • ${rescheduleTarget.vehiclePlate}`
            : undefined
        }
        onClose={() => setRescheduleTarget(null)}
      >
        <form onSubmit={handleConfirmReschedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal Baru
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Slot Jam Baru
            </label>
            <select
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:border-[#0E7490] outline-none"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot} WIB
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRescheduleTarget(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E7490] hover:bg-cyan-700 px-5 py-2 text-sm font-bold text-white"
            >
              Simpan Jadwal Baru
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
