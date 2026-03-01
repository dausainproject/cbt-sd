'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* KARTU ADMIN GURU */}
        <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group border border-slate-100">
          <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m12.733 12.87c-.783.57-1.838.888-2.914.888-1.076 0-2.131-.318-2.914-.888m12.733-12.87a11.956 11.956 0 01-12.733 0m12.733 0a11.956 11.956 0 010 12.87m-12.733-12.87a11.956 11.956 0 000 12.87" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Admin Guru</h2>
          <p className="text-slate-500 leading-relaxed mb-10 text-lg">Manajemen data peserta didik, bank soal, & monitoring.</p>
          <Link href="/admin/login" className="mt-auto w-full py-4 px-6 border-2 border-rose-500 text-rose-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all">
            Masuk Portal →
          </Link>
        </div>

        {/* KARTU PESERTA DIDIK */}
        <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group border border-slate-100">
          <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Peserta Didik</h2>
          <p className="text-slate-500 leading-relaxed mb-10 text-lg">Akses ujian online & lihat hasil evaluasi mandiri secara cepat.</p>
          <Link href="/peserta/login" className="mt-auto w-full py-4 px-6 border-2 border-amber-500 text-amber-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-white transition-all">
            Masuk Portal →
          </Link>
        </div>
      </div>

      <footer className="mt-16 text-slate-400 font-medium">Tahun Pelajaran 2025/2026 © e-Asesmen</footer>
    </div>
  )
}