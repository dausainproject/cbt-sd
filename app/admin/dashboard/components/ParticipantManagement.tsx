"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

export default function ParticipantManagement() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Manajemen Peserta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Kelola seluruh akun peserta ujian
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50">
          Import Peserta
        </button>

        <button className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50">
          Generate NoPes
        </button>

        <button className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50">
          Generate Password
        </button>

        <button className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
          Cetak Kartu
        </button>
      </div>

      {/* SEARCH */}
      <div>
        <input
          type="text"
          placeholder="Cari nama peserta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden border border-slate-200 rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-6 py-4 text-left">No</th>
              <th className="px-6 py-4 text-left">Nama Peserta</th>
              <th className="px-6 py-4 text-left">Username</th>
              <th className="px-6 py-4 text-left">Password</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {/* Dummy Row dulu */}
            <tr className="border-t hover:bg-slate-50 transition">
              <td className="px-6 py-4">1</td>
              <td className="px-6 py-4 font-medium text-slate-700">
                Contoh Nama
              </td>
              <td className="px-6 py-4 text-slate-600">
                2026001
              </td>
              <td className="px-6 py-4 text-slate-600">
                123456
              </td>
              <td className="px-6 py-4 text-center space-x-3">
                <button className="text-indigo-600 hover:text-indigo-800">
                  <Pencil size={16} />
                </button>
                <button className="text-rose-600 hover:text-rose-800">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}