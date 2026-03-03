"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type Participant = {
  no_peserta: string;
  nama_lengkap: string;
  password: string;
};

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [kodeSekolah, setKodeSekolah] = useState("");
  const [loadingGen, setLoadingGen] = useState(false);
  
  
  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from("data_siswa")
    .select("*")
    .order("nama_lengkap", { ascending: true });

  if (error) {
    alert("Error fetch: " + error.message);
    console.error(error);
  } else {
    console.log("DATA:", data);
    setParticipants(data ?? []);
  }

  setLoading(false);
};

  const filteredParticipants = participants.filter((p) =>
    p.nama_lengkap?.toLowerCase().includes(search.toLowerCase())
  );

  // ================= DOWNLOAD TEMPLATE =================
  const handleDownloadTemplate = () => {
    const data = [
      {
        no: 1,
        no_peserta: "2025001",
        nama_lengkap: "Budi Santoso",
        jk: "L",
        kelas: "XII IPA 1",
        password: "123456",
        sesi: "1",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Format Import");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "Format_Import_Peserta.xlsx");
  };

  // ================= IMPORT LOGIC =================
  const handleImport = async () => {
  if (!selectedFile) return;

  setImporting(true);

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rawData.length) {
        alert("File kosong!");
        setImporting(false);
        return;
      }

      // 🔥 Normalize header (lowercase + trim)
      const jsonData = rawData.map((row) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          newRow[key.toLowerCase().trim()] = row[key];
        });
        return newRow;
      });
	  
	  // 🔥 Buang baris yang kosong / tidak lengkap
	const cleanData = jsonData.filter(
  (row) =>
    row.no_peserta &&
    row.nama_lengkap &&
    row.jk &&
    row.kelas &&
    row.password &&
    row.sesi
	);

      // 🔥 Mapping sesuai struktur DB
      const insertData = cleanData.map((row) => ({
        no_peserta: String(row.no_peserta).trim(),
        nama_lengkap: String(row.nama_lengkap).trim(),
        jk: String(row.jk).trim(),
        kelas: String(row.kelas).trim(),
        password: String(row.password).trim(),
        sesi: String(row.sesi).trim(),
      }));

//fungsi gen nopes
const handleGenerateNopes = async () => {
  if (kodeSekolah.length !== 6) {
    alert("Kode sekolah harus 6 digit");
    return;
  }

  setLoadingGen(true);

  // Ambil semua siswa
  const { data: siswa, error } = await supabase
    .from("data_siswa")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    alert("Gagal ambil data");
    setLoadingGen(false);
    return;
  }

  const updatedData = siswa.map((item, index) => {
    const nomorUrut = String(index + 1).padStart(2, "0");
    return {
      ...item,
      no_peserta: `${kodeSekolah}${nomorUrut}`,
    };
  });

  // Update satu per satu (karena PK berubah)
  for (const row of updatedData) {
    await supabase
      .from("data_siswa")
      .update({ no_peserta: row.no_peserta })
      .eq("nama_lengkap", row.nama_lengkap);
  }

  alert("Nomor peserta berhasil digenerate");
  setShowGenModal(false);
  setLoadingGen(false);

  fetchParticipants(); // reload table
};






// 🔥 Hilangkan duplikat no_peserta dalam 1 file
const uniqueMap = new Map();

insertData.forEach((item) => {
  uniqueMap.set(item.no_peserta, item);
});

const uniqueInsertData = Array.from(uniqueMap.values());
      const { error } = await supabase
  .from("data_siswa")
  .upsert(uniqueInsertData, { onConflict: "no_peserta" });

      if (error) {
        alert("Gagal import: " + error.message);
      } else {
        alert("Import berhasil 🚀");
        fetchParticipants();
      }

    } catch (err: any) {
      alert("Terjadi kesalahan saat membaca file.");
      console.error(err);
    }

    setImporting(false);
    setShowImport(false);
    setSelectedFile(null);
  };

  reader.readAsArrayBuffer(selectedFile);
};

  return (
  <>
    <div className="space-y-6">
      ... SEMUA ISI HALAMAN LO ...
      ... IMPORT MODAL ...
    </div>

    {showGenModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded w-96">
          <h2 className="text-lg font-semibold mb-4">
            Generate Nomor Peserta
          </h2>

          <label className="block mb-2 text-sm">
            Input Kode Sekolah (6 digit)
          </label>

          <input
            type="text"
            value={kodeSekolah}
            onChange={(e) => setKodeSekolah(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-4"
            placeholder="050658"
            maxLength={6}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowGenModal(false)}
              className="px-3 py-2 border rounded"
            >
              Batal
            </button>

            <button
              onClick={handleGenerateNopes}
              disabled={loadingGen}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {loadingGen ? "Proses..." : "Gen Nopes"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}