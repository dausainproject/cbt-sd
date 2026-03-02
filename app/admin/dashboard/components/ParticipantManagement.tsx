"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, X } from "lucide-react";

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

  const [showImport, setShowImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleImport = async () => {
    if (!selectedFile) return;

    // nanti kita isi parsing excel disini
    alert("Import logic belum diaktifkan 🚀");

    setShowImport(false);
    setSelectedFile(null);
  };

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
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50"
        >
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
      <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
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

      {/* ================= IMPORT MODAL ================= */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowImport(false)}
          />

          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 space-y-6">

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-800">
                Import Peserta Ujian
              </h3>
              <button
                onClick={() => setShowImport(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <button
              className="w-full py-3 rounded-xl border border-slate-300 
              hover:bg-slate-50 text-sm font-medium transition"
            >
              Download Format Excel
            </button>

            <label
              className="flex flex-col items-center justify-center 
              border-2 border-dashed border-slate-300 
              rounded-2xl p-10 cursor-pointer 
              hover:border-indigo-500 hover:bg-indigo-50 
              transition"
            >
              <p className="text-slate-500 text-sm mb-2">
                Drag & Drop file Excel di sini
              </p>
              <p className="text-xs text-slate-400">
                Format yang diterima: .xlsx
              </p>

              <input
                type="file"
                accept=".xlsx"
                hidden
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            {selectedFile && (
              <div className="text-sm bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl">
                File dipilih: <span className="font-medium">{selectedFile.name}</span>
              </div>
            )}

            <button
              disabled={!selectedFile}
              onClick={handleImport}
              className="w-full py-3 text-white rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600
              hover:from-indigo-700 hover:to-purple-700 transition
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Peserta Ujian
            </button>

          </div>
        </div>
      )}

    </div>
  );
}