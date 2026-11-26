import {
  Booking,
  Complaint,
  Membership,
  ServicePackage,
} from '../types/carakate';

function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getTodayYMD(): string {
  return formatDateYMD(new Date());
}

export function getInitialPackages(): ServicePackage[] {
  return [
    {
      id: 'pkg-bronze',
      name: 'Bronze',
      priceMonthly: 150000,
      exteriorQuota: 4,
      hasPriorityQueue: false,
      priorityLevel: 'NORMAL',
      hasInteriorVacuum: false,
      detailingPerMonth: 0,
      description:
        'Cocok untuk pengguna harian yang ingin mobil selalu bersih dengan biaya pasti dan hemat.',
      badgeColor: '#b45309',
      isActive: true,
    },
    {
      id: 'pkg-silver',
      name: 'Silver',
      priceMonthly: 280000,
      exteriorQuota: 8,
      hasPriorityQueue: true,
      priorityLevel: 'PRIORITY',
      hasInteriorVacuum: true,
      detailingPerMonth: 1,
      description:
        'Pilihan terpopuler di Banda Aceh: bebas antre panjang, vakum interior rutin, plus 1x detailing bulanan.',
      badgeColor: '#475569',
      isActive: true,
    },
    {
      id: 'pkg-gold',
      name: 'Gold',
      priceMonthly: 450000,
      exteriorQuota: 'UNLIMITED',
      hasPriorityQueue: true,
      priorityLevel: 'TOP_PRIORITY',
      hasInteriorVacuum: true,
      detailingPerMonth: 2,
      description:
        'Perawatan VIP tanpa batas (maks. 1x/hari = 30 slot/bln), antre prioritas utama, vakum tiap cuci, & 2x detailing.',
      badgeColor: '#d97706',
      isActive: true,
    },
  ];
}

export function getInitialMemberships(): Membership[] {
  const today = new Date();
  return [
    {
      id: 'mem-1',
      memberCode: 'CRK-2026-001',
      fullName: 'Teuku Rizky Pratama',
      phone: '081269014420',
      email: 'rizky.pratama@acehmail.id',
      vehiclePlate: 'BL 1420 AA',
      vehicleModel: 'Toyota Fortuner VRZ Hitam',
      tier: 'GOLD',
      monthlyQuota: 30,
      remainingQuota: 26,
      loyaltyPoints: 340,
      status: 'ACTIVE',
      startDate: addDays(today, -10).toISOString(),
      endDate: addDays(today, 20).toISOString(),
    },
    {
      id: 'mem-2',
      memberCode: 'CRK-2026-002',
      fullName: 'Cut Nabila Safira',
      phone: '085277881234',
      email: 'nabila.safira@gmail.com',
      vehiclePlate: 'BL 8821 A',
      vehicleModel: 'Honda HR-V SE Putih',
      tier: 'SILVER',
      monthlyQuota: 8,
      remainingQuota: 5,
      loyaltyPoints: 210,
      status: 'ACTIVE',
      startDate: addDays(today, -12).toISOString(),
      endDate: addDays(today, 18).toISOString(),
    },
    {
      id: 'mem-3',
      memberCode: 'CRK-2026-003',
      fullName: 'Muhammad Fadhil',
      phone: '082361009988',
      email: 'fadhil.bna@gmail.com',
      vehiclePlate: 'BL 1909 AB',
      vehicleModel: 'Mitsubishi Xpander Ultimate Silver',
      tier: 'BRONZE',
      monthlyQuota: 4,
      remainingQuota: 2,
      loyaltyPoints: 95,
      status: 'ACTIVE',
      startDate: addDays(today, -15).toISOString(),
      endDate: addDays(today, 15).toISOString(),
    },
    {
      id: 'mem-4',
      memberCode: 'CRK-2026-004',
      fullName: 'Syarifah Aulia Rahmah',
      phone: '081360554321',
      email: 'aulia.rahmah@usk.ac.id',
      vehiclePlate: 'BL 7742 AC',
      vehicleModel: 'Mazda CX-5 Kuro Merah',
      tier: 'SILVER',
      monthlyQuota: 8,
      remainingQuota: 7,
      loyaltyPoints: 165,
      status: 'ACTIVE',
      startDate: addDays(today, -5).toISOString(),
      endDate: addDays(today, 25).toISOString(),
    },
  ];
}

export function getInitialBookings(): Booking[] {
  const today = new Date();
  const todayStr = formatDateYMD(today);
  const tomorrowStr = formatDateYMD(addDays(today, 1));
  const yesterdayStr = formatDateYMD(addDays(today, -1));

  return [
    {
      id: 'bk-1',
      bookingCode: 'BK-2611-01',
      memberId: 'mem-1',
      customerName: 'Teuku Rizky Pratama',
      phone: '081269014420',
      vehiclePlate: 'BL 1420 AA',
      vehicleModel: 'Toyota Fortuner VRZ Hitam',
      serviceType: 'Cuci Membership',
      bookingDate: todayStr,
      timeSlot: '09:00',
      queuePriority: 'TOP_PRIORITY',
      status: 'IN_PROGRESS',
      notes: 'Tolong fokus bersihkan kolong spakbor bekas hujan di Lamnyong.',
      createdAt: addDays(today, -1).toISOString(),
      quotaDeducted: false,
    },
    {
      id: 'bk-2',
      bookingCode: 'BK-2611-02',
      memberId: 'mem-2',
      customerName: 'Cut Nabila Safira',
      phone: '085277881234',
      vehiclePlate: 'BL 8821 A',
      vehicleModel: 'Honda HR-V SE Putih',
      serviceType: 'Detailing Berkala',
      bookingDate: todayStr,
      timeSlot: '10:30',
      queuePriority: 'PRIORITY',
      status: 'CONFIRMED',
      notes: 'Pakai jatah detailing bulanan + vakum karpet.',
      createdAt: addDays(today, -1).toISOString(),
      quotaDeducted: false,
    },
    {
      id: 'bk-3',
      bookingCode: 'BK-2611-03',
      memberId: 'mem-3',
      customerName: 'Muhammad Fadhil',
      phone: '082361009988',
      vehiclePlate: 'BL 1909 AB',
      vehicleModel: 'Mitsubishi Xpander Ultimate Silver',
      serviceType: 'Cuci Membership',
      bookingDate: todayStr,
      timeSlot: '13:30',
      queuePriority: 'NORMAL',
      status: 'PENDING',
      notes: 'Cuci eksterior rutin.',
      createdAt: today.toISOString(),
      quotaDeducted: false,
    },
    {
      id: 'bk-4',
      bookingCode: 'BK-2611-04',
      customerName: 'Zulfikar Hasan',
      phone: '08116800321',
      vehiclePlate: 'BL 4512 AD',
      vehicleModel: 'Toyota Avanza Veloz Abu-abu',
      serviceType: 'Cuci Satuan Eksterior & Vakum',
      bookingDate: tomorrowStr,
      timeSlot: '15:00',
      queuePriority: 'NORMAL',
      status: 'PENDING',
      notes: 'Non-member, mau coba layanan I wish U wash here dulu.',
      createdAt: today.toISOString(),
      quotaDeducted: false,
    },
    {
      id: 'bk-5',
      bookingCode: 'BK-2611-05',
      memberId: 'mem-4',
      customerName: 'Syarifah Aulia Rahmah',
      phone: '081360554321',
      vehiclePlate: 'BL 7742 AC',
      vehicleModel: 'Mazda CX-5 Kuro Merah',
      serviceType: 'Cuci Membership',
      bookingDate: yesterdayStr,
      timeSlot: '16:30',
      queuePriority: 'PRIORITY',
      status: 'COMPLETED',
      notes: 'Selesai tepat waktu, hasil mengkilap.',
      createdAt: addDays(today, -2).toISOString(),
      quotaDeducted: true,
    },
  ];
}

export function getInitialComplaints(): Complaint[] {
  const today = new Date();
  return [
    {
      id: 'cmp-1',
      ticketCode: 'CMP-2026-001',
      bookingCode: 'BK-2611-05',
      memberCode: 'CRK-2026-004',
      customerName: 'Syarifah Aulia Rahmah',
      phone: '081360554321',
      category: 'CLEANLINESS',
      severity: 'MEDIUM',
      description:
        'Bagian velg belakang sebelah kiri masih terdapat sedikit sisa noda aspal setelah pencucian kemarin sore.',
      status: 'RESOLVED',
      adminResolution:
        'Mohon maaf atas ketidaknyamanannya Ibu Aulia. Kami telah memberikan gratis pembersihan ulang velg + bonus +25 Poin Loyalitas pada kunjungan berikutnya.',
      createdAt: addDays(today, -1).toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: 'cmp-2',
      ticketCode: 'CMP-2026-002',
      bookingCode: 'BK-2611-02',
      memberCode: 'CRK-2026-002',
      customerName: 'Cut Nabila Safira',
      phone: '085277881234',
      category: 'QUEUE_DELAY',
      severity: 'LOW',
      description:
        'Minggu lalu jadwal jam 10:30 sempat mundur sekitar 15 menit karena ada kendaraan besar sebelumnya.',
      status: 'IN_PROGRESS',
      adminResolution:
        'Tim operasional sedang mengevaluasi alokasi bay prioritas untuk slot pagi agar tidak terjadi keterlambatan.',
      createdAt: addDays(today, -2).toISOString(),
      updatedAt: addDays(today, -1).toISOString(),
    },
    {
      id: 'cmp-3',
      ticketCode: 'CMP-2026-003',
      memberCode: 'CRK-2026-003',
      customerName: 'Muhammad Fadhil',
      phone: '082361009988',
      category: 'BILLING',
      severity: 'HIGH',
      description:
        'Saya ingin memastikan perpanjangan paket Bronze saya bulan depan bisa langsung dibayar via QRIS di lokasi Banda Aceh.',
      status: 'OPEN',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
  ];
}
