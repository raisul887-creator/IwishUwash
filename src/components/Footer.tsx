import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="mb-4 inline-flex items-center rounded-2xl bg-white px-3.5 py-2 shadow-md">
              <img
                src="/logo.png"
                alt="I wish U wash here — Wish Bersih? Wash di Sini."
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Layanan cuci mobil terjadwal, antre prioritas, dan membership
              bulanan pertama dengan sistem kuota transparan di Banda Aceh.
              Mobil selalu kinclong tanpa drama antre panjang.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-amber-400 border border-slate-700">
              <Sparkles className="h-3.5 w-3.5" />
              Area Layanan: Banda Aceh & Aceh Besar
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-cyan-400 transition-colors">
                  Beranda & Kalkulator Hemat
                </Link>
              </li>
              <li>
                <Link
                  to="/membership"
                  className="hover:text-cyan-400 transition-colors"
                >
                  Paket & Kartu Membership
                </Link>
              </li>
              <li>
                <Link
                  to="/bookings"
                  className="hover:text-cyan-400 transition-colors"
                >
                  Booking Jadwal Cuci
                </Link>
              </li>
              <li>
                <Link
                  to="/complaints"
                  className="hover:text-cyan-400 transition-colors"
                >
                  Pusat Komplain & Garansi
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="hover:text-cyan-400 transition-colors"
                >
                  Dashboard Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Lokasi & Jam Buka
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Jl. Teuku Nyak Arief No. 88, Lamnyong, Syiah Kuala, Kota Banda
                  Aceh
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Setiap Hari: 08.00 – 20.00 WIB</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>0812-6900-8888 (WhatsApp CS)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} I wish U wash here Banda Aceh. All rights reserved.</p>
          <p>Didesain untuk pengalaman cuci mobil modern & transparan.</p>
        </div>
      </div>
    </footer>
  );
};
