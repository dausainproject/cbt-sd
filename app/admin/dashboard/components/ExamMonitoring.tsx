"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Siswa = {
  no_peserta: string;
  nama_lengkap: string;
  kelas: string;
};

type Asesmen = {
  id: number;
  nama_asesmen: string;
};

type Monitoring = {
  no_peserta: string;
  nama_lengkap: string;
  status: string;
  pelanggaran: number;
};

export default function ExamMonitoring() {
  
  const [asesmen, setAsesmen] = useState<Asesmen[]>([]);
  const [selectedAsesmen, setSelectedAsesmen] = useState<number | null>(null);
  const [durasi, setDurasi] = useState(60);

  const [token, setToken] = useState("");
  const [peserta, setPeserta] = useState<Monitoring[]>([]);
  const [search, setSearch] = useState("");

  const [statLogin, setStatLogin] = useState(0);
  const [statSedang, setStatSedang] = useState(0);
  const [statSelesai, setStatSelesai] = useState(0);
  const [statWarning, setStatWarning] = useState(0);
  
  const [sesi, setSesi] = useState(1);
  const [ujianAktif, setUjianAktif] = useState(false);
const [jenisSesi, setJenisSesi] = useState("utama");

  // ===============================
  // LOAD KELAS
  // ===============================


useEffect(() => {
  loadKonfigurasi();
}, [selectedAsesmen, sesi]);

  useEffect(() => {
  loadAsesmen();
}, []);
  // ===============================
  // LOAD ASESMEN
  // ===============================

  async function loadAsesmen() {
  const { data } = await supabase
    .from("data_asesmen")
    .select("*")
    .limit(1)
    .single();

  if (data) {
    setAsesmen([data]);
    setSelectedAsesmen(data.id); // 🔥 AUTO PILIH
  }
}

  // ===============================
  // LOAD PESERTA
  // ===============================

  async function loadPeserta() {
    const { data: siswa } = await supabase
  .from("data_siswa")
  .select("no_peserta,nama_lengkap")
  .eq("status", true);

    if (!siswa) return;

    const { data: laporan } = await supabase
  .from("laporan_ujian")
  .select("*")
  .eq("id_asesmen", selectedAsesmen)
  .eq("sesi", sesi);

    const result = siswa.map((s) => {
      const lap = laporan?.find((l) => l.no_peserta === s.no_peserta);

      return {
        no_peserta: s.no_peserta,
        nama_lengkap: s.nama_lengkap,
        status: lap?.status || "belum_login",
        pelanggaran: lap?.pelanggaran || 0,
      };
    });

    setPeserta(result);
    hitungStat(result);
  }
  
  
  async function mulaiUjian() {
  if (!selectedAsesmen) {
    alert("Pilih asesmen dulu");
    return;
  }

  // 🔥 WAJIB ADA TOKEN DULU
  if (!token) {
    alert("Rilis token dulu!");
    return;
  }

  // 🔥 CEK DATA UJIAN AKTIF
  const { data: existing } = await supabase
    .from("ujian_aktif")
    .select("*")
    .eq("id_asesmen", selectedAsesmen)
    .eq("sesi", sesi)
    .maybeSingle();

  let error;

  if (existing) {
    const res = await supabase
      .from("ujian_aktif")
      .update({
        waktu_mulai: new Date(),
        durasi_menit: durasi,
        status: "berjalan",
        jenis_sesi: jenisSesi
      })
      .eq("id_asesmen", selectedAsesmen)
      .eq("sesi", sesi);

    error = res.error;
  } else {
    const res = await supabase
      .from("ujian_aktif")
      .insert({
        id_asesmen: selectedAsesmen,
        waktu_mulai: new Date(),
        durasi_menit: durasi,
        status: "berjalan",
        sesi: sesi,
        jenis_sesi: jenisSesi
      });

    error = res.error;
  }

  if (error) {
    console.log(error);
    alert("Gagal memulai ujian: " + error.message);
  } else {
    alert("Ujian dimulai");
    setUjianAktif(true);
    loadPeserta();
  }
}
  
  // STOP UJIAN
async function stopUjian() {
  if (!selectedAsesmen) return;

  // 🔥 1. MATIKAN UJIAN
  const { error } = await supabase
    .from("ujian_aktif")
    .update({
      status: "selesai"
    })
    .eq("id_asesmen", selectedAsesmen)
    .eq("sesi", sesi);

  if (error) {
    console.log(error);
    alert("Gagal menghentikan ujian");
    return;
  }

  // 🔥 2. MATIKAN TOKEN DI DB
  await supabase
    .from("token_ujian")
    .update({ status: false })
    .eq("id_asesmen", selectedAsesmen);

  // 🔥 3. CLEAR TOKEN DI UI
  setToken("");

  // 🔥 4. MATIKAN STATE
  setUjianAktif(false);

  alert("Ujian dihentikan");

  // 🔥 5. RELOAD DATA
  loadPeserta();
}

async function loadKonfigurasi() {
  if (!selectedAsesmen) return;

  const { data } = await supabase
    .from("ujian_aktif")
    .select("*")
    .eq("id_asesmen", selectedAsesmen)
    .eq("sesi", sesi)
    .maybeSingle();

  if (data) {
    setDurasi(data.durasi_menit);
    setJenisSesi(data.jenis_sesi || "utama");
    setUjianAktif(data.status === "berjalan");
  }
}

//kunci token
async function loadToken() {
  if (!selectedAsesmen || ujianAktif) return; // 🔥 INI KUNCI

  const { data } = await supabase
    .from("token_ujian")
    .select("token")
    .eq("id_asesmen", selectedAsesmen)
    .eq("status", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    setToken(data.token);
  } else {
    setToken("");
  }
}

useEffect(() => {
  loadToken();
}, [selectedAsesmen]);


  // ===============================
  // STATISTIK
  // ===============================

  function hitungStat(data: Monitoring[]) {
    setStatLogin(data.filter((p) => p.status !== "belum_login").length);
    setStatSedang(data.filter((p) => p.status === "sedang").length);
    setStatSelesai(
  data.filter((p) => p.status === "selesai" || p.status === "auto_submit").length
);
    setStatWarning(data.filter((p) => p.pelanggaran > 0).length);
  }

 useEffect(() => {
  loadPeserta();
}, [selectedAsesmen, sesi]);

  // ===============================
  // REALTIME UPDATE
  // ===============================

const handler = (payload: any) => {
  const newData = payload.new;

  if (
    newData?.id_asesmen === selectedAsesmen &&
    newData?.sesi === sesi
  ) {
    setPeserta((prev: Monitoring[]) => {
      const exists = prev.some(
        (p) => p.no_peserta === newData.no_peserta
      );

      let updated: Monitoring[];

      if (exists) {
        updated = prev.map((p) =>
          p.no_peserta === newData.no_peserta
            ? {
                ...p,
                status: newData.status,
                pelanggaran: newData.pelanggaran,
              }
            : p
        );
      } else {
        updated = [
          ...prev,
          {
            no_peserta: newData.no_peserta,
            nama_lengkap: "-", // aman dulu
            status: newData.status,
            pelanggaran: newData.pelanggaran,
          },
        ];
      }

      hitungStat(updated);
      return updated;
    });
  }
};




  useEffect(() => {
  const channel = supabase
    .channel("monitoring")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "laporan_ujian",
      },
      handler
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "laporan_ujian",
      },
      handler
    )
    .subscribe((status) => {
      console.log("REALTIME:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedAsesmen, sesi]);

  // ===============================
  // ===============================
// GENERATE TOKEN
// ===============================

async function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  if (!selectedAsesmen) return;

  // 🔥 1. MATIKAN SEMUA TOKEN LAMA
  await supabase
    .from("token_ujian")
    .update({ status: false })
    .eq("id_asesmen", selectedAsesmen);

  // 🔥 2. INSERT TOKEN BARU
  const { error } = await supabase
    .from("token_ujian")
    .insert({
      id_asesmen: selectedAsesmen,
      token: result,
      status: true,
    });

  if (!error) {
    setToken(result);
  }
}

  // ===============================
  // RESET PESERTA
  // ===============================

  async function resetPeserta(no: string) {
    await supabase
      .from("laporan_ujian")
      .delete()
      .eq("no_peserta", no)
      .eq("id_asesmen", selectedAsesmen)
.eq("sesi", sesi);

    loadPeserta();
  }

  // ===============================
  // FILTER SEARCH
  // ===============================

  const filtered = peserta.filter((p) =>
    p.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    p.no_peserta.toLowerCase().includes(search.toLowerCase())
  );

  // ===============================
  // STATUS BADGE
  // ===============================

  function statusBadge(status: string) {
  if (status === "sedang")
    return <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Tes Berlangsung</span>;

  if (status === "selesai" || status === "auto_submit")
    return <span className="bg-green-200 text-green-800 px-2 py-1 rounded">Selesai</span>;

  return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Belum Login</span>;
}

  
  
  // ===============================
  // UI
  // ===============================

  return (
    <div className="p-6 grid grid-cols-3 gap-6">

      {/* LEFT SIDE */}
<div className="col-span-1 space-y-6">

  
  {/* ⚙️ KONFIGURASI */}
  <div className="bg-white p-4 rounded-2xl shadow">
    <h2 className="font-bold mb-4">Konfigurasi Ujian</h2>

    <p className="mb-3 text-sm">
      Asesmen: <b>{asesmen[0]?.nama_asesmen || "-"}</b>
    </p>

    <label className="text-sm">Durasi (menit)</label>
    <input
      type="number"
      disabled={ujianAktif}
      className="w-full border p-2 mb-3 rounded"
      value={durasi}
      onChange={(e) => setDurasi(Number(e.target.value))}
    />

    <label className="text-sm">Sesi Ujian</label>
    <select
      disabled={ujianAktif}
      className="w-full border p-2 mb-3 rounded"
      value={sesi}
      onChange={(e) => setSesi(Number(e.target.value))}
    >
      <option value={1}>Sesi 1 (Utama)</option>
      <option value={2}>Sesi 2 (Susulan)</option>
      <option value={3}>Sesi 3</option>
    </select>

    <label className="text-sm">Jenis Sesi</label>
    <select
      disabled={ujianAktif}
      className="w-full border p-2 mb-3 rounded"
      value={jenisSesi}
      onChange={(e) => setJenisSesi(e.target.value)}
    >
      <option value="utama">Ujian Utama</option>
      <option value="susulan">Ujian Susulan</option>
    </select>

    {/* TOKEN */}
    <div className="bg-gray-100 p-3 rounded mb-3 text-center">
      <p className="text-xs text-gray-500">TOKEN</p>
      <div className="text-lg font-mono tracking-widest">
        {token || "------"}
      </div>
    </div>

    <button
      onClick={generateToken}
      disabled={ujianAktif}
      className={`w-full py-2 rounded mb-3 text-white ${
        ujianAktif || !!token
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      RILIS TOKEN
    </button>

    <button
      onClick={ujianAktif ? stopUjian : mulaiUjian}
      className={`w-full py-2 rounded text-white font-semibold ${
        ujianAktif
          ? "bg-red-600 hover:bg-red-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {ujianAktif ? "STOP UJIAN" : "MULAI UJIAN"}
    </button>
  </div>

  {/* 📊 STATISTIK */}
  <div className="bg-sky-500 text-white p-4 rounded-2xl shadow">
    <h2 className="font-bold mb-3">Statistik</h2>

    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="bg-white/20 p-2 rounded">
        Login : {statLogin}
      </div>

      <div className="bg-white/20 p-2 rounded">
        Sedang : {statSedang}
      </div>

      <div className="bg-white/20 p-2 rounded">
        Selesai : {statSelesai}
      </div>

      <div className="bg-white/20 p-2 rounded">
        Warning : {statWarning}
      </div>
    </div>
  </div>

</div>
		
		
		
      
      {/* RIGHT SIDE */}
      <div className="col-span-2 bg-white p-4 rounded shadow">

        <input
          type="text"
          placeholder="🔍 Cari username / nama"
          className="border p-2 w-full mb-4"
          onChange={(e) => setSearch(e.target.value)}
        />

        <table className="w-full text-sm border">
          <thead className="bg-sky-100">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2">Username</th>
              <th className="border p-2">Nama Peserta</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Warning</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>

          <tbody>
  {[...filtered]
.sort((a, b) => {
  if (a.pelanggaran > b.pelanggaran) return -1;
  if (a.pelanggaran < b.pelanggaran) return 1;

  const order: any = {
  sedang: 1,
  belum_login: 2,
  selesai: 3,
  auto_submit: 3
};

  return order[a.status] - order[b.status];
})
.map((p, i) => (
              <tr
  key={p.no_peserta}
  className={
    p.pelanggaran > 0
      ? "bg-red-50"
      : p.status === "sedang"
      ? "bg-yellow-50"
      : p.status === "selesai"
      ? "bg-green-50"
      : ""
  }
>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{p.no_peserta}</td>
                <td className="border p-2">{p.nama_lengkap}</td>
                <td className="border p-2">{statusBadge(p.status)}</td>
                <td className="border p-2 text-center">
                  {p.pelanggaran > 0 ? "⚠️ " + p.pelanggaran : "-"}
                </td>

                <td className="border p-2">
                  <button
                    onClick={() => resetPeserta(p.no_peserta)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}
