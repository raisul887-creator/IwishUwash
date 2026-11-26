import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Award,
  Check,
  X,
  ArrowRight,
  CalendarClock,
  Search,
  Calculator,
  Crown,
  MapPin,
} from 'lucide-react';
import { useCarakate } from '../context/CarakateContext';
import { formatRupiah, PRIORITY_LABELS } from '../utils/format';

const SINGLE_WASH_PRICE = 50000;

export const HomePage: React.FC = () => {
  const { packages, memberships, bookings } = useCarakate();
  const navigate = useNavigate();
  const [washPerMonth, setWashPerMonth] = useState<number>(6);

  const activePackages = useMemo(
    () => packages.filter((p) => p.isActive),
    [packages]
  );

  const singleWashTotal = washPerMonth * SINGLE_WASH_PRICE;

  const recommendedPlan = useMemo(() => {
    const bronze = activePackages.find(
      (p) => p.name.toUpperCase() === 'BRONZE'
    );
    const silver = activePackages.find(
      (p) => p.name.toUpperCase() === 'SILVER'
    );
    const gold = activePackages.find((p) => p.name.toUpperCase() === 'GOLD');

    if (washPerMonth <= 4 && bronze) {
      return {
        pkg: bronze,
        effectiveCost: bronze.priceMonthly,
        savings: singleWashTotal - bronze.priceMonthly,
      };
    }
    if (washPerMonth <= 8 && silver) {
      return {
        pkg: silver,
        effectiveCost: silver.priceMonthly,
        savings: singleWashTotal - silver.priceMonthly,
      };
    }
    if (gold) {
      return {
        pkg: gold,
        effectiveCost: gold.priceMonthly,
        savings: singleWashTotal - gold.priceMonthly,
      };
    }
    const fallback = activePackages[0];
    return fallback
      ? {
          pkg: fallback,
          effectiveCost: fallback.priceMonthly,
          savings: singleWashTotal - fallback.priceMonthly,
        }
      : null;
  }, [activePackages, washPerMonth, singleWashTotal]);

  const activeMembersCount = memberships.filter(
    (m) => m.status === 'ACTIVE'
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  const handleSelectPackage = (pkgName: string) => {
    const tier = pkgName.toUpperCase();
    const validTier =
      tier === 'BRONZE' || tier === 'SILVER' || tier === 'GOLD'
        ? tier
        : 'SILVER';
    navigate(`/membership?tier=${validTier}`);
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #06b6d4 0%, transparent 45%), radial-gradient(circle at 80% 70%, #f59e0b 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 border border-cyan-400/30 px-4 py-1.5 text-xs sm:text-sm font-medium text-cyan-300">
                <MapPin className="h-4 w-4 text-amber-400" />
                Layanan Carwash Membership #1 di Banda Aceh
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Solusi Antre &amp; Biaya Tak Pasti —{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300">
                  Cuci Mobil Terjadwal &amp; Membership
                </span>{' '}
                di Banda Aceh
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                <strong className="text-white">
                  Wish Bersih? Wash di Sini.
                </strong>{' '}
                Nikmati cuci mobil premium dengan slot waktu pasti, jalur antre
                prioritas member, serta harga bulanan yang jauh lebih hemat
                dibanding cuci satuan.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/membership"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0E7490] hover:bg-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/40 transition-all"
                >
                  <Crown className="h-4 w-4 text-amber-300" />
                  Gabung Membership
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/bookings"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition-all"
                >
                  <CalendarClock className="h-4 w-4" />
                  Booking Cuci Sekarang
                </Link>
                <Link
                  to="/bookings#lacak"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-100 transition-all"
                >
                  <Search className="h-4 w-4 text-cyan-400" />
                  Lacak Status
                </Link>
              </div>

              {/* Quick Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-white">
                    {activeMembersCount}+
                  </p>
                  <p className="text-xs text-slate-400">Member Aktif Demo</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-cyan-300">
                    08.00–20.00
                  </p>
                  <p className="text-xs text-slate-400">Buka Setiap Hari</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-amber-400">
                    {completedCount + 120}+
                  </p>
                  <p className="text-xs text-slate-400">Mobil Kinclong</p>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white px-2.5 py-1.5 shadow-sm shrink-0">
                      <img
                        src="/logo.png"
                        alt="I wish U wash here"
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                        Kartu Digital Member
                      </p>
                      <p className="text-base font-bold text-white">
                        I wish U wash here Gold VIP
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300">
                    PRIORITAS UTAMA
                  </span>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Kode Member</span>
                    <span className="font-mono font-bold text-cyan-300">
                      CRK-2026-001
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Plat Kendaraan</span>
                    <span className="font-bold text-white">BL 1420 AA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Kuota Cuci</span>
                    <span className="font-semibold text-emerald-400">
                      Sepuasnya (1x/Hari)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Vakum &amp; Detailing</span>
                    <span className="font-semibold text-amber-300">
                      Tiap Cuci + 2x/Bln
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
                  <span>Jl. Teuku Nyak Arief, Banda Aceh</span>
                  <Link
                    to="/membership"
                    className="text-cyan-300 hover:text-cyan-200 font-semibold inline-flex items-center gap-1"
                  >
                    Cek Kartu Anda <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN UTAMA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0E7490]">
            Kenapa Memilih I wish U wash here?
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Pengalaman Cuci Mobil Modern Tanpa Ribet
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Dirancang khusus untuk mobilitas warga Banda Aceh agar kendaraan
            tetap bersih dari debu dan hujan tanpa buang waktu antre.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-cyan-50 text-[#0E7490] flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Harga Pasti &amp; Transparan
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Tidak ada biaya tambahan tersembunyi. Pilih paket bulanan mulai
              dari Rp 150.000/bulan dan hemat hingga ratusan ribu rupiah setiap
              bulannya.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Antre Prioritas Terjadwal
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Booking slot jam cuci langsung dari HP. Member Silver &amp; Gold
              mendapatkan jalur bay prioritas sehingga langsung dikerjakan saat
              tiba.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Loyalitas Poin &amp; Garansi Bersih
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Setiap pencucian dan perpanjangan menambah Poin Loyalitas. Kurang
              puas dengan hasil? Laporkan di Pusat Komplain untuk garansi cuci
              ulang.
            </p>
          </div>
        </div>
      </section>

      {/* KALKULATOR HEMAT INTERAKTIF */}
      <section className="bg-gradient-to-b from-cyan-50/70 to-white border-y border-slate-200/80 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-[#0E7490] flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">
                    Kalkulator Hemat I wish U wash here
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Bandingkan biaya cuci satuan (Rp 50.000/cuci) vs Membership
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-xs font-semibold w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Simulasi Real-Time
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="wash-slider"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Berapa kali Anda mencuci mobil dalam sebulan?
                  </label>
                  <span className="rounded-xl bg-[#0E7490] px-4 py-1.5 text-lg font-extrabold text-white">
                    {washPerMonth}x / bulan
                  </span>
                </div>
                <input
                  id="wash-slider"
                  type="range"
                  min={1}
                  max={12}
                  value={washPerMonth}
                  onChange={(e) => setWashPerMonth(Number(e.target.value))}
                  className="w-full carakate-slider"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>1x</span>
                  <span>4x (Mingguan)</span>
                  <span>8x (2x/Minggu)</span>
                  <span>12x (Intensif)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Biaya Cuci Satuan
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {formatRupiah(singleWashTotal)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {washPerMonth}x × Rp 50.000 (tanpa prioritas &amp; detailing)
                  </p>
                </div>

                {recommendedPlan && (
                  <>
                    <div className="rounded-2xl bg-cyan-50 border-2 border-[#0E7490] p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0E7490]">
                        Rekomendasi: Paket {recommendedPlan.pkg.name}
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-[#0E7490]">
                        {formatRupiah(recommendedPlan.effectiveCost)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Rata-rata hanya{' '}
                        <strong>
                          {formatRupiah(
                            Math.round(
                              recommendedPlan.effectiveCost / washPerMonth
                            )
                          )}
                        </strong>{' '}
                        per cuci!
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-5 border ${
                        recommendedPlan.savings > 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {recommendedPlan.savings > 0
                          ? 'Estimasi Penghematan'
                          : 'Keuntungan Tambahan'}
                      </p>
                      <p
                        className={`mt-2 text-2xl font-extrabold ${
                          recommendedPlan.savings > 0
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {recommendedPlan.savings > 0
                          ? `Hemat ${formatRupiah(recommendedPlan.savings)}`
                          : 'Lebih Praktis & Terjadwal'}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {recommendedPlan.savings > 0
                          ? `Hemat hingga ${formatRupiah(
                              recommendedPlan.savings * 12
                            )} per tahun!`
                          : 'Cocok mulai dari 4x cuci/bulan untuk hemat maksimal.'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {recommendedPlan && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    Siap berhemat dengan paket{' '}
                    <strong className="text-slate-900">
                      {recommendedPlan.pkg.name}
                    </strong>
                    ? Daftar hanya dalam 1 menit.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectPackage(recommendedPlan.pkg.name)
                    }
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white font-bold text-sm px-6 py-3 transition-colors"
                  >
                    Pilih Paket {recommendedPlan.pkg.name}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* KARTU & TABEL PERBANDINGAN PAKET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0E7490]">
            Pilihan Paket Membership
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Pilih Tier Sesuai Kebutuhan Mobil Anda
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Semua paket aktif selama 30 hari dengan kartu digital, pelacakan
            kuota otomatis, dan poin loyalitas.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {activePackages.map((pkg) => {
            const isGold = pkg.name.toUpperCase() === 'GOLD';
            const isSilver = pkg.name.toUpperCase() === 'SILVER';

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all ${
                  isGold
                    ? 'bg-slate-900 text-white border-2 border-amber-400 shadow-2xl'
                    : isSilver
                    ? 'bg-white text-slate-900 border-2 border-[#0E7490] shadow-lg'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                }`}
              >
                {isSilver && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0E7490] px-3.5 py-1 text-xs font-bold text-white shadow">
                    Paling Populer
                  </span>
                )}
                {isGold && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3.5 py-1 text-xs font-bold text-slate-950 shadow">
                    VIP Unlimited
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-extrabold">{pkg.name}</h3>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: pkg.badgeColor }}
                    />
                  </div>
                  <p
                    className={`text-sm min-h-[3.5rem] ${
                      isGold ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {pkg.description}
                  </p>

                  <div className="my-6 pb-6 border-b border-slate-200/20">
                    <span className="text-3xl font-extrabold">
                      {formatRupiah(pkg.priceMonthly)}
                    </span>
                    <span
                      className={`text-sm ${
                        isGold ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {' '}
                      / bulan
                    </span>
                  </div>

                  <ul className="space-y-3 text-sm mb-8">
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Kuota Cuci Eksterior:{' '}
                        <strong>
                          {pkg.exteriorQuota === 'UNLIMITED'
                            ? 'Sepuasnya (Maks. 1x/hari)'
                            : `${pkg.exteriorQuota}x / bulan`}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      {pkg.hasPriorityQueue ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          !pkg.hasPriorityQueue ? 'opacity-65' : undefined
                        }
                      >
                        Antrean: {PRIORITY_LABELS[pkg.priorityLevel]}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      {pkg.hasInteriorVacuum ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          !pkg.hasInteriorVacuum ? 'opacity-65' : undefined
                        }
                      >
                        {pkg.hasInteriorVacuum
                          ? 'Vakum Interior tiap cuci'
                          : 'Tanpa vakum interior rutin'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      {pkg.detailingPerMonth > 0 ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          pkg.detailingPerMonth === 0 ? 'opacity-65' : undefined
                        }
                      >
                        {pkg.detailingPerMonth > 0
                          ? `Detailing / Poles ${pkg.detailingPerMonth}x / bulan`
                          : 'Tanpa detailing bulanan'}
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg.name)}
                  className={`w-full rounded-xl py-3 px-4 text-sm font-bold transition-colors ${
                    isGold
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : isSilver
                      ? 'bg-[#0E7490] hover:bg-cyan-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Pilih Paket {pkg.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Tabel Perbandingan Fitur Paket
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/70 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Fitur Layanan</th>
                  {activePackages.map((pkg) => (
                    <th
                      key={pkg.id}
                      className="px-6 py-3.5 font-bold text-slate-900"
                    >
                      {pkg.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-3.5 font-medium text-slate-700">
                    Harga Bulanan
                  </td>
                  {activePackages.map((pkg) => (
                    <td
                      key={pkg.id}
                      className="px-6 py-3.5 font-bold text-[#0E7490]"
                    >
                      {formatRupiah(pkg.priceMonthly)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-slate-700">
                    Kuota Cuci Eksterior
                  </td>
                  {activePackages.map((pkg) => (
                    <td key={pkg.id} className="px-6 py-3.5 text-slate-700">
                      {pkg.exteriorQuota === 'UNLIMITED'
                        ? 'Sepuasnya (Maks. 1x/hari)'
                        : `${pkg.exteriorQuota}x / bulan`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-slate-700">
                    Prioritas Antrean
                  </td>
                  {activePackages.map((pkg) => (
                    <td key={pkg.id} className="px-6 py-3.5 text-slate-700">
                      {PRIORITY_LABELS[pkg.priorityLevel]}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-slate-700">
                    Vakum Interior Rutin
                  </td>
                  {activePackages.map((pkg) => (
                    <td key={pkg.id} className="px-6 py-3.5">
                      {pkg.hasInteriorVacuum ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="h-4 w-4" /> Ya, tiap cuci
                        </span>
                      ) : (
                        <span className="text-slate-400">Tidak</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-medium text-slate-700">
                    Detailing / Poles Berkala
                  </td>
                  {activePackages.map((pkg) => (
                    <td key={pkg.id} className="px-6 py-3.5 text-slate-700">
                      {pkg.detailingPerMonth > 0
                        ? `${pkg.detailingPerMonth}x / bulan`
                        : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
