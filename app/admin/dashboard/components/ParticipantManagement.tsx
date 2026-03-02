"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("data_siswa")
      .select("id, nama_lengkap, no_peserta, password")
      .order("nama_lengkap", { ascending: true });

    if (error) console.error(error.message);
    else setParticipants(data ?? []);

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

      const { error } = await supabase
        .from("data_siswa")
        .insert(insertData);

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
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Manajemen Peserta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Kelola seluruh akun peserta ujian
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50"
        >
          Import Peserta
        </button>
      </div>

      <input
        type="text"
        placeholder="Cari nama peserta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-80 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
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
                <td colSpan={5} className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredParticipants.map((participant, index) => (
                <tr key={participant.id} className="border-t hover:bg-indigo-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium">
                    {participant.nama_lengkap}
                  </td>
                  <td className="px-6 py-4">
                    {participant.no_peserta}
                  </td>
                  <td className="px-6 py-4">
                    {participant.password}
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <Pencil size={16} className="inline text-indigo-600" />
                    <Trash2 size={16} className="inline text-rose-500" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* IMPORT MODAL */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowImport(false)}
          />

          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 space-y-6">

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Import Peserta Ujian
              </h3>
              <button onClick={() => setShowImport(false)}>
                <X size={18} />
              </button>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="w-full py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium"
            >
              Download Format Excel
            </button>

            <input
              type="file"
              accept=".xlsx"
              onChange={(e) =>
                e.target.files && setSelectedFile(e.target.files[0])
              }
            />

            {selectedFile && (
              <p className="text-sm text-indigo-600">
                {selectedFile.name}
              </p>
            )}

            <button
              disabled={!selectedFile || importing}
              onClick={handleImport}
              className="w-full py-3 text-white rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600
              disabled:opacity-50"
            >
              {importing ? "Mengimport..." : "Import Peserta Ujian"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}