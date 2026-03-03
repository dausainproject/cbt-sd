"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, Plus, X } from "lucide-react";

type Mapel = {
  id: number;
  nama_mapel: string;
  kode_mapel: string | null;
};

export default function MapelManagement() {
  const [mapel, setMapel] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState<Mapel | null>(null);

  const [namaMapel, setNamaMapel] = useState("");
  const [kodeMapel, setKodeMapel] = useState("");

  useEffect(() => {
    fetchMapel();
  }, []);

  // ================= FETCH DATA =================
  const fetchMapel = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("data_mapel")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      alert("Gagal mengambil data mapel");
    } else {
      setMapel(data ?? []);
    }

    setLoading(false);
  };

  // ================= INSERT / UPDATE =================
  const handleSubmit = async () => {
    if (!namaMapel.trim()) {
      alert("Nama mapel wajib diisi");
      return;
    }

    if (editingData) {
      // UPDATE
      const { error } = await supabase
        .from("data_mapel")
        .update({
          nama_mapel: namaMapel.trim(),
          kode_mapel: kodeMapel.trim() || null,
        })
        .eq("id", editingData.id);

      if (error) {
        alert("Gagal update: " + error.message);
        return;
      } else {
        alert("Berhasil update");
      }
    } else {
      // INSERT
      const { error } = await supabase.from("data_mapel").insert({
        nama_mapel: namaMapel.trim(),
        kode_mapel: kodeMapel.trim() || null,
      });

      if (error) {
        alert("Gagal tambah: " + error.message);
        return;
      } else {
        alert("Berhasil tambah");
      }
    }

    // RESET
    setShowModal(false);
    setEditingData(null);
    setNamaMapel("");
    setKodeMapel("");
    fetchMapel();
  };

  // ================= DELETE =================
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus mata pelajaran ini?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("data_mapel")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal hapus: " + error.message);
    } else {
      alert("Berhasil dihapus");
      fetchMapel();
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          Manajemen Mata Pelajaran
        </h2>

        <button
          onClick={() => {
            setEditingData(null);
            setNamaMapel("");
            setKodeMapel("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl shadow hover:scale-105 transition"
        >
          <Plus size={18} />
          + Mapel
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-6 py-4 text-left">No</th>
              <th className="px-6 py-4 text-left">Nama Mapel</th>
              <th className="px-6 py-4 text-left">Kode Mapel</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : mapel.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Belum ada data mapel
                </td>
              </tr>
            ) : (
              mapel.map((m, index) => (
                <tr key={m.id} className="border-t hover:bg-indigo-50 transition">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">{m.nama_mapel}</td>
                  <td className="px-6 py-4">{m.kode_mapel || "-"}</td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <Pencil
                      size={16}
                      className="inline text-indigo-600 cursor-pointer hover:scale-110 transition"
                      onClick={() => {
                        setEditingData(m);
                        setNamaMapel(m.nama_mapel);
                        setKodeMapel(m.kode_mapel || "");
                        setShowModal(true);
                      }}
                    />

                    <Trash2
                      size={16}
                      className="inline text-rose-500 cursor-pointer hover:scale-110 transition"
                      onClick={() => handleDelete(m.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96 space-y-4 shadow-xl">
            
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {editingData ? "Edit Mapel" : "Tambah Mapel"}
              </h2>
              <X
                size={18}
                className="cursor-pointer hover:text-red-500"
                onClick={() => setShowModal(false)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nama Mapel</label>
              <input
                type="text"
                value={namaMapel}
                onChange={(e) => setNamaMapel(e.target.value)}
                className="w-full border px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Kode Mapel</label>
              <input
                type="text"
                value={kodeMapel}
                onChange={(e) => setKodeMapel(e.target.value)}
                className="w-full border px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                Batal
              </button>

              <button
                onClick={handleSubmit}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                {editingData ? "Update" : "Simpan"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}