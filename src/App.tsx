import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CarakateProvider } from './context/CarakateContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { HomePage } from './pages/HomePage';
import { MembershipPage } from './pages/MembershipPage';
import { BookingsPage } from './pages/BookingsPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <CarakateProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/complaints" element={<ComplaintsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer />
          </div>
        </BrowserRouter>
      </CarakateProvider>
    </ToastProvider>
  );
};

export default App;
