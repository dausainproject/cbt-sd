"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";

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

  const [selected, setSelected] = useState<Participant | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const showToast = (message: string, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchParticipants = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("data_siswa")
      .select("id, nama_lengkap, no_peserta, password")
      .order("nama_lengkap", { ascending: true });

    setParticipants(data ?? []);
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    const { error } = await supabase
      .from("data_siswa")
      .update({
        nama_lengkap: selected.nama_lengkap,
        no_peserta: selected.no_peserta,
        password: selected.password,
      })
      .eq("id", selected.id);

    if (error) {
      showToast("Gagal update data", "error");
    } else {
      showToast("Data berhasil diperbarui");
      setShowEdit(false);
      fetchParticipants();
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    const { error } = await supabase
      .from("data_siswa")
      .delete()
      .eq("id", selected.id);

    if (error) {
      showToast("Gagal menghapus data", "error");
    } else {
      showToast("Peserta berhasil dihapus");
      setShowDelete(false);
      fetchParticipants();
    }
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const filteredParticipants = participants.filter((p) =>
    p.nama_lengkap?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg text-white ${
            toast.type === "error"
              ? "bg-rose-500"
              : "bg-gradient-to-r from-indigo-600 to-purple-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Manajemen Peserta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Kelola seluruh akun peserta ujian
        </p>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Cari nama peserta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-80 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
      />

      {/* TABLE */}
      <div className="overflow-hidden border border-slate-200 rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 text-left">No</th>
              <th className="px-6 py-4 text-left">Nama</th>
              <th className="px-6 py-4 text-left">Username</th>
              <th className="px-6 py-4 text-left">Password</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredParticipants.map((p, i) => (
                <tr key={p.id} className="border-t hover:bg-indigo-50 transition">
                  <td className="px-6 py-4">{i + 1}</td>
                  <td className="px-6 py-4 font-medium">{p.nama_lengkap}</td>
                  <td className="px-6 py-4">{p.no_peserta}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {visiblePasswords.includes(p.id)
                      ? p.password
                      : "••••••"}
                    <button
                      onClick={() => togglePassword(p.id)}
                      className="text-slate-500 hover:text-indigo-600"
                    >
                      {visiblePasswords.includes(p.id) ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <button
                      onClick={() => {
                        setSelected(p);
                        setShowEdit(true);
                      }}
                      className="text-indigo-600 hover:text-purple-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelected(p);
                        setShowDelete(true);
                      }}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT SLIDE PANEL */}
      {showEdit && selected && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Peserta</h3>
              <button onClick={() => setShowEdit(false)}>
                <X size={18} />
              </button>
            </div>

            <input
              value={selected.nama_lengkap}
              onChange={(e) =>
                setSelected({ ...selected, nama_lengkap: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-xl"
            />
            <input
              value={selected.no_peserta}
              onChange={(e) =>
                setSelected({ ...selected, no_peserta: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-xl"
            />
            <input
              value={selected.password}
              onChange={(e) =>
                setSelected({ ...selected, password: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-xl"
            />

            <button
              onClick={handleUpdate}
              className="w-full py-3 text-white rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600
              hover:from-indigo-700 hover:to-purple-700 transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative bg-white rounded-2xl p-8 shadow-xl w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Hapus Peserta?
            </h3>
            <p className="text-sm text-slate-500">
              Data tidak bisa dikembalikan setelah dihapus.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 border rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 text-white rounded-xl bg-rose-500 hover:bg-rose-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}