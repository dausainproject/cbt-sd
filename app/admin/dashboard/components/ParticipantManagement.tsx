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
  status: boolean; // 🔥 TAMBAH
};

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [kodeSekolah, setKodeSekolah] = useState("");
  const [loadingGen, setLoadingGen] = useState(false);
  const allActive = participants.length > 0 && participants.every((p) => p.status);
  
  
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

const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  const used = new Set();

  while (result.length < 8) {
    const randomChar =
      chars[Math.floor(Math.random() * chars.length)];

    if (!used.has(randomChar)) {
      used.add(randomChar);
      result += randomChar;
    }
  }

  return result + "*";
};

const handleGeneratePassword = async () => {
  if (!participants.length) return;

  const confirm = window.confirm(
    "Yakin ingin generate ulang password seluruh peserta?"
  );
  if (!confirm) return;

  setLoadingPassword(true);

  try {
    const updates = participants.map((p) => ({
      no_peserta: p.no_peserta,
      password: generateRandomPassword(),
    }));

    for (const u of updates) {
      await supabase
        .from("data_siswa")
        .update({ password: u.password })
        .eq("no_peserta", u.no_peserta);
    }

    alert("Password berhasil digenerate ulang!");
    fetchParticipants();
    setShowPasswordModal(false);
  } catch (err) {
    alert("Gagal generate password!");
  } finally {
    setLoadingPassword(false);
  }
};

// ================= TOMBOL TOGGLE AKTIF =================
const handleToggleAllStatus = async () => {
  const newStatus = !allActive;

  const confirm = window.confirm(
    newStatus
      ? "Aktifkan semua peserta?"
      : "Nonaktifkan semua peserta?"
  );
  if (!confirm) return;

  try {
    for (const p of participants) {
      const { error } = await supabase
        .from("data_siswa")
        .update({ status: newStatus })
        .eq("no_peserta", p.no_peserta);

      if (error) {
        console.error(error);
        alert("Gagal update salah satu data");
        return;
      }
    }

    // 🔥 update UI langsung tanpa fetch ulang
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        status: newStatus,
      }))
    );

  } catch (err) {
    console.error(err);
    alert("Terjadi error");
  }
};

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
    status: "aktif", // 🔥 TAMBAH INI
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
    row.sesi && row.status
	);

      // 🔥 Mapping sesuai struktur DB
      const insertData = cleanData.map((row) => ({
  no_peserta: String(row.no_peserta).trim(),
  nama_lengkap: String(row.nama_lengkap).trim(),
  jk: String(row.jk).trim(),
  kelas: String(row.kelas).trim(),
  password: String(row.password).trim(),
  sesi: String(row.sesi).trim(),

  // 🔥 INI YANG PENTING
  status:
    String(row.status).toLowerCase().trim() === "aktif",
}));

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

      <div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Manajemen Peserta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Kelola seluruh akun peserta ujian
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
  <button
    onClick={() => setShowImport(true)}
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    Import Peserta
  </button>

  <button
    onClick={() => setShowGenModal(true)}
    className="bg-green-600 text-white px-4 py-2 rounded"
  >
    Gen Nopes
  </button>

  <button
    onClick={() => setShowPasswordModal(true)}
    className="bg-rose-600 text-white px-4 py-2 rounded"
  >
    Gen Password
  </button>
</div>
	  
	  

      <input
        type="text"
        placeholder="Cari nama peserta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-80 px-4 py-2 text-sm border border-slate-300 rounded-xl"
      />

      <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 text-left">No</th>
              <th className="px-6 py-4 text-left">Nama Peserta</th>
              <th className="px-6 py-4 text-left">No Peserta</th>
              <th className="px-6 py-4 text-left">Password</th>
              <th className="px-6 py-4 text-center">
  <div className="flex flex-col items-center gap-1">
    
    {/* 🔥 TEXT DI ATAS */}
    <span className="text-xs font-medium">
      {allActive ? "SEMUA AKTIF" : "SEMUA NON AKTIF"}
    </span>

    {/* 🔥 TOGGLE DI BAWAH */}
    <button
      onClick={handleToggleAllStatus}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        allActive ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          allActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>

  </div>
</th>
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
      <tr key={participant.no_peserta} className="border-t">
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

        {/* 🔥 STATUS TOGGLE */}
        <td className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={async () => {
                const newStatus = !participant.status;

                await supabase
                  .from("data_siswa")
                  .update({ status: newStatus })
                  .eq("no_peserta", participant.no_peserta);

                // update UI tanpa reload
                setParticipants((prev) =>
                  prev.map((p) =>
                    p.no_peserta === participant.no_peserta
                      ? { ...p, status: newStatus }
                      : p
                  )
                );
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                participant.status ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  participant.status
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>

            <span
              className={`text-xs font-medium ${
                participant.status
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {participant.status ? "Aktif" : "Non Aktif"}
            </span>
          </div>
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
            className="absolute inset-0 bg-black/40"
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
              className="w-full py-3 rounded-xl border border-slate-300"
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

            <button
              disabled={!selectedFile || importing}
              onClick={handleImport}
              className="w-full py-3 text-white rounded-xl bg-indigo-600 disabled:opacity-50"
            >
              {importing ? "Mengimport..." : "Import Peserta Ujian"}
            </button>
          </div>
        </div>
      )}
    </div>

    {/* GEN NOPES MODAL */}
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

{showPasswordModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded w-96">
      <h2 className="text-lg font-semibold mb-4">
        Generate Password Seluruh Peserta
      </h2>

      <p className="text-sm text-slate-600 mb-6">
        Semua password peserta akan diganti menjadi random 8 karakter unik
        (A-Z, a-z, 0-9) dan diakhiri tanda *
      </p>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowPasswordModal(false)}
          className="px-3 py-2 border rounded"
        >
          Batal
        </button>

        <button
          onClick={handleGeneratePassword}
          disabled={loadingPassword}
          className="bg-rose-600 text-white px-4 py-2 rounded"
        >
          {loadingPassword ? "Proses..." : "Generate"}
        </button>
      </div>
    </div>
  </div>
)}	
	

  </>
);
}