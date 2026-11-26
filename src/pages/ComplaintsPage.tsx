import React, { useMemo, useState } from 'react';
import {
  MessageSquareWarning,
  Upload,
  Search,
  Send,
  CheckCircle2,
  Edit3,
  Trash2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useCarakate } from '../context/CarakateContext';
import { useToast } from '../context/ToastContext';
import {
  Complaint,
  ComplaintCategory,
  ComplaintSeverity,
} from '../types/carakate';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_SEVERITY_LABELS,
  formatDateTimeID,
} from '../utils/format';
import {
  ComplaintStatusBadge,
  SeverityBadge,
} from '../components/StatusBadges';
import { Modal } from '../components/Modal';

export const ComplaintsPage: React.FC = () => {
  const { complaints, createComplaint, updateComplaint, deleteComplaint } =
    useCarakate();
  const { showToast } = useToast();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('CLEANLINESS');
  const [severity, setSeverity] = useState<ComplaintSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined
  );

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [editTarget, setEditTarget] = useState<Complaint | null>(null);
  const [extraDetail, setExtraDetail] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'File tidak valid', 'Harap pilih file gambar (JPG/PNG).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar terlalu besar', 'Maksimal 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !description.trim()) {
      showToast(
        'error',
        'Data belum lengkap',
        'Nama, No. HP, dan kronologi komplain wajib diisi.'
      );
      return;
    }

    const res = createComplaint({
      customerName,
      phone,
      bookingCode: bookingCode || undefined,
      memberCode: memberCode || undefined,
      category,
      severity,
      description,
      photoDataUrl,
    });

    if (!res.ok) {
      showToast('error', 'Gagal Mengirim Komplain', res.message);
      return;
    }

    showToast('success', 'Tiket Komplain Dibuat', res.message);
    if (res.data) {
      setTrackQuery(res.data.ticketCode);
    }
    setCustomerName('');
    setPhone('');
    setBookingCode('');
    setMemberCode('');
    setDescription('');
    setPhotoDataUrl(undefined);
  };

  const trackedComplaints = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter(
      (c) =>
        c.ticketCode.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
    );
  }, [complaints, trackQuery]);

  const handleSaveExtraDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !extraDetail.trim()) return;
    const updatedDescription = `${editTarget.description}\n\n[Tambahan Pelanggan]: ${extraDetail.trim()}`;
    const res = updateComplaint(editTarget.id, {
      description: updatedDescription,
    });
    if (res.ok) {
      showToast('success', 'Detail Ditambahkan', res.message);
      setEditTarget(null);
      setExtraDetail('');
    }
  };

  const handleCancelTicket = (c: Complaint) => {
    if (
      !window.confirm(
        `Batalkan dan hapus tiket komplain ${c.ticketCode}? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }
    const res = deleteComplaint(c.id);
    if (res.ok) {
      showToast('info', 'Tiket Dibatalkan', res.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#0E7490]">
          <MessageSquareWarning className="h-4 w-4 text-amber-500" />
          Garansi Kualitas I wish U wash here
        </span>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Pusat Komplain &amp; Lacak Tiket
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
          Kepuasan Anda prioritas kami. Laporkan kendala kebersihan, antrean,
          atau layanan dengan bukti foto agar segera kami tindak lanjuti.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: CREATE COMPLAINT FORM */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white">
            <h2 className="text-base font-bold">Form Pengajuan Komplain</h2>
            <p className="text-xs text-slate-300">
              Nomor tiket otomatis dibuat untuk pelacakan status penanganan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0E7490] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. WhatsApp / HP *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0E7490] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Booking (Opsional)
                </label>
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="BK-2611-01"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-[#0E7490] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Member (Opsional)
                </label>
                <input
                  type="text"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                  placeholder="CRK-2026-001"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-[#0E7490] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Komplain *
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ComplaintCategory)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white focus:border-[#0E7490] outline-none"
                >
                  {(
                    Object.keys(COMPLAINT_CATEGORY_LABELS) as ComplaintCategory[]
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {COMPLAINT_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Urgensi *
                </label>
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as ComplaintSeverity)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white focus:border-[#0E7490] outline-none"
                >
                  {(
                    Object.keys(COMPLAINT_SEVERITY_LABELS) as ComplaintSeverity[]
                  ).map((sev) => (
                    <option key={sev} value={sev}>
                      {COMPLAINT_SEVERITY_LABELS[sev]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kronologi Masalah *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan detail kendala yang Anda alami..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] outline-none"
              />
            </div>

            {/* Photo Upload Preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upload Foto Bukti (Opsional, maks. 3MB)
              </label>
              {photoDataUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={photoDataUrl}
                    alt="Preview bukti komplain"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(undefined)}
                    className="absolute top-2 right-2 rounded-full bg-slate-900/80 text-white p-1.5 hover:bg-rose-600 transition-colors"
                    aria-label="Hapus foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0E7490] bg-slate-50/70 p-5 cursor-pointer transition-colors">
                  <Upload className="h-6 w-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-600">
                    Klik untuk pilih foto bukti
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    PNG, JPG, WEBP
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0E7490] hover:bg-cyan-700 text-white font-bold py-3 px-4 text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Kirim Tiket Komplain
            </button>
          </form>
        </div>

        {/* RIGHT: TRACK COMPLAINTS */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-[#0E7490]" />
              Lacak Status Tiket Komplain
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cari menggunakan Nomor Tiket (mis.{' '}
              <button
                type="button"
                onClick={() => setTrackQuery('CMP-2026-001')}
                className="font-mono text-[#0E7490] underline"
              >
                CMP-2026-001
              </button>
              ) atau Nomor HP Anda.
            </p>
            <div className="mt-3 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Ketik Nomor Tiket atau No. HP..."
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-[#0E7490] outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {trackedComplaints.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
                Tiket komplain tidak ditemukan.
              </div>
            ) : (
              trackedComplaints.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#0E7490]">
                          {c.ticketCode}
                        </span>
                        <ComplaintStatusBadge status={c.status} />
                        <SeverityBadge severity={c.severity} />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {COMPLAINT_CATEGORY_LABELS[c.category]} —{' '}
                        <span className="font-normal text-slate-600">
                          {c.customerName} ({c.phone})
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDateTimeID(c.createdAt)}
                    </span>
                  </div>

                  {(c.bookingCode || c.memberCode) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {c.bookingCode && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
                          Booking: {c.bookingCode}
                        </span>
                      )}
                      {c.memberCode && (
                        <span className="rounded-md bg-cyan-50 px-2 py-0.5 font-mono text-[#0E7490]">
                          Member: {c.memberCode}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    {c.description}
                  </p>

                  {c.photoDataUrl && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Foto Bukti Terlampir:
                      </p>
                      <img
                        src={c.photoDataUrl}
                        alt={`Bukti ${c.ticketCode}`}
                        className="h-40 w-auto rounded-xl border border-slate-200 object-cover"
                      />
                    </div>
                  )}

                  {c.adminResolution && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Tanggapan &amp; Solusi Admin I wish U wash here:
                      </p>
                      <p className="text-sm text-emerald-900 leading-relaxed">
                        {c.adminResolution}
                      </p>
                    </div>
                  )}

                  {c.status === 'OPEN' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(c);
                          setExtraDetail('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-[#0E7490] border border-cyan-200 px-3 py-1.5 text-xs font-bold transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Tambah Keterangan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelTicket(c)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-bold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Batalkan Tiket
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah Detail Komplain */}
      <Modal
        open={Boolean(editTarget)}
        title="Tambah Detail Keterangan"
        subtitle={editTarget ? `Tiket ${editTarget.ticketCode}` : undefined}
        onClose={() => setEditTarget(null)}
      >
        <form onSubmit={handleSaveExtraDetail} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keterangan Tambahan
            </label>
            <textarea
              rows={4}
              required
              value={extraDetail}
              onChange={(e) => setExtraDetail(e.target.value)}
              placeholder="Tuliskan informasi tambahan untuk tim I wish U wash here..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0E7490] outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E7490] hover:bg-cyan-700 px-5 py-2 text-sm font-bold text-white"
            >
              Simpan Tambahan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
