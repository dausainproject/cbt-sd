"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Soal = {
  id: number;
  pertanyaan: string;
  tipe: string;
  gambar: string | null;
  bobot: number;
  pilihan: any;
  kunci: any;
};

export default function BankSoalPage() {
  const [asesmen, setAsesmen] = useState<string | null>(null);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Ambil asesmen aktif (Model B cuma 1)
    const { data: asesmenData } = await supabase
      .from("data_asesmen")
      .select("*")
      .limit(1)
      .single();

    if (asesmenData) {
      setAsesmen(asesmenData.nama_asesmen);

      const { data: soalData } = await supabase
        .from("bank_soal")
        .select("*")
        .eq("id_asesmen", asesmenData.id)
        .order("id", { ascending: true });

      setSoal(soalData || []);
    } else {
      setAsesmen(null);
      setSoal([]);
    }

    setLoading(false);
  }

  const totalBobot = soal.reduce((acc, s) => acc + (s.bobot || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">BANK SOAL</h1>
        <p className="text-gray-600 mt-1">
          {asesmen ? asesmen : "Belum ada asesmen"}
        </p>
      </div>

      {/* STATISTIK */}
      <div className="flex gap-6">
        <div>
          <p className="text-sm text-gray-500">Total Soal</p>
          <p className="text-lg font-semibold">{soal.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Bobot</p>
          <p className="text-lg font-semibold">{totalBobot}</p>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Import JSON
        </button>
        <button className="px-4 py-2 bg-red-600 text-white rounded">
          Reset Soal
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">No</th>
              <th className="p-2">Pertanyaan</th>
              <th className="p-2">Gambar</th>
              <th className="p-2">Tipe</th>
              <th className="p-2">Jawaban</th>
              <th className="p-2">Bobot</th>
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-2" colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : soal.length === 0 ? (
              <tr>
                <td className="p-2 text-center" colSpan={7}>
                  Belum ada soal
                </td>
              </tr>
            ) : (
              soal.map((item, index) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 max-w-xs truncate">
                    {item.pertanyaan}
                  </td>
                  <td className="p-2">
                    {item.gambar ? "Ada" : "-"}
                  </td>
                  <td className="p-2">{item.tipe}</td>
                  <td className="p-2">
                    {item.tipe === "pg"
                      ? JSON.stringify(item.kunci)
                      : "-"}
                  </td>
                  <td className="p-2">{item.bobot}</td>
                  <td className="p-2">
                    <button className="text-blue-600">Edit</button>
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