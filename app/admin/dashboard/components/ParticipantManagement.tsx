"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";

type Participant = {
  id: string;
  nama_lengkap: string;
  no_peserta: string;
  password: string;
};

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("data_siswa")
      .select("id, nama_lengkap, no_peserta, password")
      .order("nama_lengkap", { ascending: true });

    if (error) {
      console.error("Fetch error:", error.message);
    } else {
      setParticipants(data ?? []);
    }

    setLoading(false);
  };

  const filteredParticipants = participants.filter((p) =>
    p.nama_lengkap?.toLowerCase().includes(search.toLowerCase())
  );

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

        <button
          className="px-4 py-2 text-sm font-medium text-white rounded-xl
          bg-gradient-to-r from-indigo-600 to-purple-600
          hover:from-indigo-700 hover:to-purple-700 transition"
        >
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
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  Loading data...
                </td>
              </tr>
            ) : filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Data tidak ditemukan
                </td>
              </tr>
            ) : (
              filteredParticipants.map((participant, index) => (
                <tr
                  key={participant.id}
                  className="border-t hover:bg-indigo-50 transition"
                >
                  <td className="px-6 py-4">{index + 1}</td>

                  <td className="px-6 py-4 font-medium text-slate-700">
                    {participant.nama_lengkap}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {participant.no_peserta}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {participant.password}
                  </td>

                  <td className="px-6 py-4 text-center space-x-3">
                    <button className="text-indigo-600 hover:text-purple-600">
                      <Pencil size={16} />
                    </button>

                    <button className="text-rose-500 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}