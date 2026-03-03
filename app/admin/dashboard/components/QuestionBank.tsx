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
  const [showImport, setShowImport] = useState(false);
  const [namaAsesmen, setNamaAsesmen] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [asesmenId, setAsesmenId] = useState<number | null>(null);

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
  setAsesmenId(asesmenData.id); // <-- TAMBAH INI

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
function renderJawaban(item: Soal) {
  if (item.tipe === "pg" && typeof item.kunci === "string") {
    return item.kunci;
  }

  if (item.tipe === "pgk" && Array.isArray(item.kunci)) {
    return item.kunci.join(", ");
  }

  if (item.tipe === "benar_salah") {
    return item.kunci;
  }

  return "-";
}
async function handleImport() {
  if (!namaAsesmen.trim() || !file) {
    alert("Nama asesmen dan file wajib diisi");
    return;
  }

  setImporting(true);

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    if (!Array.isArray(json)) {
      alert("Format JSON harus berupa array");
      setImporting(false);
      return;
    }

    // 🔥 1. Hapus semua asesmen lama (cascade hapus soal)
    await supabase.from("data_asesmen").delete().neq("id", 0);

    // 🔥 2. Insert asesmen baru
    const { data: newAsesmen, error } = await supabase
  .from("data_asesmen")
  .insert({
    nama_asesmen: namaAsesmen,
  })
  .select()
  .single();

if (error) {
  console.log("ERROR DETAIL:", error);
  alert(error.message);
  return;
}

    // 🔥 3. Siapkan data soal
    const soalToInsert = json.map((item: any) => {
      if (!["pg", "pgk", "benar_salah"].includes(item.tipe)) {
        throw new Error("Tipe soal tidak valid");
      }

      return {
        id_asesmen: newAsesmen.id,
        tipe: item.tipe,
        pertanyaan: item.pertanyaan,
        gambar: item.gambar || null,
        pilihan: item.pilihan || null,
        kunci: item.kunci,
        bobot: item.bobot || 1,
      };
    });

    const { error: soalError } = await supabase
      .from("bank_soal")
      .insert(soalToInsert);

    if (soalError) {
      alert("Gagal insert soal");
      setImporting(false);
      return;
    }

    alert("Import berhasil!");

    setShowImport(false);
    setNamaAsesmen("");
    setFile(null);
    fetchData();
  } catch (err) {
    alert("Terjadi kesalahan saat import");
  }

  setImporting(false);
}

async function handleReset() {
  if (!asesmenId) {
    alert("Tidak ada asesmen aktif");
    return;
  }

  const konfirmasi = confirm("Yakin mau hapus semua soal?");
  if (!konfirmasi) return;

  const { error } = await supabase
    .from("bank_soal")
    .delete()
    .eq("id_asesmen", asesmenId);

  if (error) {
    alert("Gagal reset soal");
    console.log(error);
  } else {
    alert("Semua soal berhasil dihapus");
    fetchData();
  }
}
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
        <button
  onClick={() => setShowImport(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Import JSON
</button>
        <button
  onClick={handleReset}
  className="px-4 py-2 bg-red-600 text-white rounded"
>
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
                  <td className="p-2 max-w-xs">
  <div className="truncate">{item.pertanyaan}</div>
  {item.pilihan && (
    <div className="text-xs text-gray-500 mt-1">
      {Object.entries(item.pilihan).map(([key, val]) => (
        <div key={key}>
          {key}. {String(val)}
        </div>
      ))}
    </div>
  )}
</td>
                  <td className="p-2">
  {item.gambar ? (
    <img
      src={item.gambar}
      alt="gambar soal"
      className="w-24 h-auto rounded border"
    />
  ) : (
    "-"
  )}
</td>
                  <td className="p-2 capitalize">
  {item.tipe === "pg"
    ? "PG"
    : item.tipe === "pgk"
    ? "PGK"
    : item.tipe === "benar_salah"
    ? "Benar/Salah"
    : item.tipe}
</td>
                  <td className="p-2">
  {renderJawaban(item)}
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

      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[400px] space-y-4">
            <h2 className="text-lg font-semibold">Import Soal</h2>

            <div>
              <label className="text-sm">Nama Asesmen</label>
              <input
                type="text"
                value={namaAsesmen}
                onChange={(e) => setNamaAsesmen(e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            <div className="space-y-2">
  <input
    id="fileUpload"
    type="file"
    accept=".json"
    onChange={(e) =>
      setFile(e.target.files ? e.target.files[0] : null)
    }
    className="hidden"
  />

  <label
    htmlFor="fileUpload"
    className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition"
  >
    Pilih File JSON
  </label>

  {file && (
    <p className="text-sm text-gray-600">
      {file.name}
    </p>
  )}
</div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="px-3 py-2 border rounded"
              >
                Batal
              </button>

              <button
                onClick={handleImport}
                disabled={importing}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
	
  );
}