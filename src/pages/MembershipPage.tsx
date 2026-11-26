import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Crown,
  Search,
  RefreshCw,
  ArrowUpCircle,
  Car,
  Sparkles,
  CheckCircle2,
  Calendar,
  Award,
  UserPlus,
  CalendarClock,
} from 'lucide-react';
import { useCarakate } from '../context/CarakateContext';
import { useToast } from '../context/ToastContext';
import { Membership, MembershipTier } from '../types/carakate';
import { formatDateID, formatRupiah } from '../utils/format';
import { MembershipStatusBadge, TierBadge } from '../components/StatusBadges';

export const MembershipPage: React.FC = () => {
  const {
    packages,
    memberships,
    findMembership,
    createMembership,
    renewMembership,
    upgradeMembership,
  } = useCarakate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Registration form state
  const initialTierParam = (searchParams.get('tier') || 'SILVER').toUpperCase();
  const validInitialTier: MembershipTier =
    initialTierParam === 'BRONZE' ||
    initialTierParam === 'SILVER' ||
    initialTierParam === 'GOLD'
      ? initialTierParam
      : 'SILVER';

  const [tier, setTier] = useState<MembershipTier>(validInitialTier);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // Member lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    memberships[0]?.id ?? null
  );
  const [notFoundMsg, setNotFoundMsg] = useState('');

  useEffect(() => {
    const param = (searchParams.get('tier') || '').toUpperCase();
    if (param === 'BRONZE' || param === 'SILVER' || param === 'GOLD') {
      setTier(param);
    }
  }, [searchParams]);

  const foundMember: Membership | undefined = memberships.find(
    (m) => m.id === selectedMemberId
  );

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !vehiclePlate.trim() ||
      !vehicleModel.trim()
    ) {
      showToast('error', 'Data belum lengkap', 'Harap isi semua kolom wajib.');
      return;
    }

    const res = createMembership({
      fullName,
      phone,
      email,
      vehiclePlate,
      vehicleModel,
      tier,
    });

    if (!res.ok) {
      showToast('error', 'Pendaftaran gagal', res.message);
      return;
    }

    showToast('success', 'Membership Aktif!', res.message);
    if (res.data) {
      setSelectedMemberId(res.data.id);
      setLookupQuery(res.data.memberCode);
      setNotFoundMsg('');
    }
    setFullName('');
    setPhone('');
    setEmail('');
    setVehiclePlate('');
    setVehicleModel('');
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      setNotFoundMsg('Masukkan Kode Member atau Plat Nomor terlebih dahulu.');
      return;
    }
    const match = findMembership(lookupQuery);
    if (!match) {
      setSelectedMemberId(null);
      setNotFoundMsg(
        `Tidak ditemukan member dengan kode/plat "${lookupQuery}". Coba contoh: CRK-2026-001 atau BL 1420 AA.`
      );
      showToast('warning', 'Member tidak ditemukan', 'Periksa kembali kode/plat.');
      return;
    }
    setSelectedMemberId(match.id);
    setNotFoundMsg('');
    showToast(
      'info',
      'Kartu Member Ditemukan',
      `${match.fullName} (${match.memberCode})`
    );
  };

  const handleRenew = (id: string) => {
    const res = renewMembership(id);
    if (res.ok) {
      showToast('success', 'Perpanjangan Berhasil', res.message);
    } else {
      showToast('error', 'Gagal memperpanjang', res.message);
    }
  };

  const handleUpgrade = (id: string, nextTier: MembershipTier) => {
    const res = upgradeMembership(id, nextTier);
    if (res.ok) {
      showToast('success', 'Upgrade Paket Berhasil', res.message);
    } else {
      showToast('error', 'Upgrade Gagal', res.message);
    }
  };

  const getPackagePrice = (t: MembershipTier) => {
    const pkg = packages.find((p) => p.name.toUpperCase() === t);
    return pkg
      ? pkg.priceMonthly
      : t === 'GOLD'
      ? 450000
      : t === 'SILVER'
      ? 280000
      : 150000;
  };

  const quotaPct = foundMember
    ? Math.min(
        100,
        Math.round(
          (foundMember.remainingQuota / Math.max(1, foundMember.monthlyQuota)) *
            100
        )
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#0E7490]">
            <Crown className="h-4 w-4 text-amber-500" />
            I wish U wash here Membership
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Daftar &amp; Kelola Kartu Member
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
            Bergabung sekarang untuk langsung mendapatkan Kode Member digital,
            kuota cuci bulanan, dan poin loyalitas.
          </p>
        </div>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-semibold w-fit transition-colors"
        >
          <CalendarClock className="h-4 w-4 text-cyan-400" />
          Lanjut ke Booking Jadwal
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: FORM JOIN MEMBERSHIP */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0E7490] flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Form Join Membership Baru</h2>
              <p className="text-xs text-slate-300">
                Otomatis aktif 30 hari &amp; bonus +50 Poin Loyalitas awal
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinSubmit} className="p-6 space-y-5">
            {/* Tier Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pilih Paket Membership
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['BRONZE', 'SILVER', 'GOLD'] as MembershipTier[]).map((t) => {
                  const selected = tier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`rounded-xl p-3 text-left border-2 transition-all ${
                        selected
                          ? t === 'GOLD'
                            ? 'border-amber-500 bg-amber-50/70'
                            : 'border-[#0E7490] bg-cyan-50/70'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <p className="text-xs font-extrabold text-slate-900">
                        {t}
                      </p>
                      <p className="text-xs font-bold text-[#0E7490] mt-0.5">
                        {formatRupiah(getPackagePrice(t))}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t === 'GOLD'
                          ? 'Sepuasnya'
                          : t === 'SILVER'
                          ? '8x + Vakum'
                          : '4x / bln'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Teuku Alif Maulana"
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
                  placeholder="0812xxxxxxxx"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Plat Nomor Kendaraan *
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="BL 1234 AA"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono uppercase focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Model &amp; Warna Mobil *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Honda Brio RS Kuning"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white font-bold py-3 px-4 text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Daftar &amp; Aktifkan Membership ({tier})
            </button>
          </form>
        </div>

        {/* RIGHT: CEK KARTU MEMBER + DIGITAL CARD + RENEW/UPGRADE */}
        <div className="lg:col-span-6 space-y-6">
          {/* Search Box */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-[#0E7490]" />
              Cek Kartu Member Digital
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cari menggunakan Kode Member (mis.{' '}
              <button
                type="button"
                onClick={() => setLookupQuery('CRK-2026-001')}
                className="font-mono text-[#0E7490] underline"
              >
                CRK-2026-001
              </button>
              ) atau Plat Nomor (mis.{' '}
              <button
                type="button"
                onClick={() => setLookupQuery('BL 8821 A')}
                className="font-mono text-[#0E7490] underline"
              >
                BL 8821 A
              </button>
              ).
            </p>

            <form onSubmit={handleLookupSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Masukkan Kode Member atau Plat Nomor..."
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                Cari
              </button>
            </form>

            {notFoundMsg && (
              <p className="mt-3 text-xs text-rose-600 font-medium">
                {notFoundMsg}
              </p>
            )}

            {/* Quick pick pills */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {memberships.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    setLookupQuery(m.memberCode);
                    setNotFoundMsg('');
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    selectedMemberId === m.id
                      ? 'bg-cyan-50 border-[#0E7490] text-[#0E7490] font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m.memberCode} ({m.tier})
                </button>
              ))}
            </div>
          </div>

          {/* Digital Member Card */}
          {foundMember && (
            <div className="space-y-4">
              <div
                className={`relative rounded-3xl p-6 sm:p-7 text-white shadow-xl overflow-hidden ${
                  foundMember.tier === 'GOLD'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 border border-amber-400/50'
                    : foundMember.tier === 'SILVER'
                    ? 'bg-gradient-to-br from-slate-900 via-[#0E7490] to-slate-800 border border-cyan-400/40'
                    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 border border-orange-400/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">
                      I wish U wash here Digital Card
                    </p>
                    <h3 className="text-xl sm:text-2xl font-extrabold mt-1">
                      {foundMember.fullName}
                    </h3>
                    <p className="font-mono text-sm text-amber-300 font-semibold mt-0.5">
                      {foundMember.memberCode}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <TierBadge tier={foundMember.tier} />
                    <MembershipStatusBadge status={foundMember.status} />
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 bg-black/25 rounded-xl px-4 py-3 border border-white/10">
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold text-white">
                    <Car className="h-4 w-4 text-cyan-300" />
                    {foundMember.vehiclePlate}
                  </span>
                  <span className="text-slate-300">
                    {foundMember.vehicleModel}
                  </span>
                </div>

                {/* Quota & Points */}
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                    <p className="text-xs text-slate-300">Sisa Kuota Bulan Ini</p>
                    <p className="text-xl font-extrabold mt-0.5">
                      {foundMember.remainingQuota}{' '}
                      <span className="text-xs font-normal text-slate-300">
                        / {foundMember.monthlyQuota}{' '}
                        {foundMember.tier === 'GOLD' ? 'slot (1x/hr)' : 'cuci'}
                      </span>
                    </p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${quotaPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                    <p className="text-xs text-slate-300 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-amber-300" />
                      Poin Loyalitas
                    </p>
                    <p className="text-xl font-extrabold text-amber-300 mt-0.5">
                      {foundMember.loyaltyPoints} pts
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Berlaku s/d {formatDateID(foundMember.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Self-Service Actions: Renew & Upgrade */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleRenew(foundMember.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-4 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Perpanjang (+30 Hari &amp; +50 Poin)
                  </button>
                </div>

                {foundMember.tier !== 'GOLD' && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Upgrade Paket Langsung (+30 Poin Bonus):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {foundMember.tier === 'BRONZE' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpgrade(foundMember.id, 'SILVER')
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-[#0E7490] border border-cyan-200 px-4 py-2 text-xs font-bold transition-colors"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Upgrade ke Silver ({formatRupiah(getPackagePrice('SILVER'))})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUpgrade(foundMember.id, 'GOLD')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-4 py-2 text-xs font-bold transition-colors"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Upgrade ke Gold VIP ({formatRupiah(getPackagePrice('GOLD'))})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
