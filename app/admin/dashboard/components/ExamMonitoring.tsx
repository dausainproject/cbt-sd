
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
const [loading, setLoading] = useState(false);
  const [statLogin, setStatLogin] = useState(0);
  const [statSedang, setStatSedang] = useState(0);
  const [statSelesai, setStatSelesai] = useState(0);
  const [statWarning, setStatWarning] = useState(0);
  
  const [sesi, setSesi] = useState(1);
  const [ujianAktif, setUjianAktif] = useState(false);
const [jenisSesi, setJenisSesi] = useState("utama");
const [isFirstLoad, setIsFirstLoad] = useState(true);
const isTokenActive = ujianAktif && token;

  // ===============================
  // LOAD KELAS
  // ===============================


useEffect(() => {
  if (!selectedAsesmen) return;
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

 async function loadPeserta() {
  if (!selectedAsesmen) return;

  // 🔥 1. AMBIL DATA SISWA
  const { data: siswa, error: errSiswa } = await supabase
  .from("data_siswa")
  .select("no_peserta,nama_lengkap")
  .eq("status", true);

if (errSiswa) {
  console.log("❌ ERROR SISWA:", errSiswa.message, errSiswa.details);
  return;
}

  if (!siswa || siswa.length === 0) {
    setPeserta([]);
    return;
  }

  const sesiFix = Number(sesi);

  // 🔥 2. AMBIL LAPORAN
  const { data: laporan, error: errLaporan } = await supabase
    .from("laporan_ujian")
    .select("*")
    .eq("id_asesmen", selectedAsesmen)
    .eq("sesi", sesiFix)
    .order("created_at", { ascending: false });

  if (errLaporan) {
  console.log("❌ ERROR LAPORAN:", errLaporan.message, errLaporan.details);
  }

  // 🔥 3. PRIORITY STATUS (WAJIB ADA DI SINI BIAR AMAN)
  const priority: Record<string, number> = {
  selesai: 5,
  auto_submit: 5,
  sedang: 3,
  belum_login: 1,
};

  // 🔥 4. AMBIL STATUS TERBAIK PER PESERTA
  const latestMap = new Map<string, any>();

  (laporan || []).forEach((l) => {
    if (!l?.no_peserta) return;

    const existing = latestMap.get(l.no_peserta);

    if (!existing) {
      latestMap.set(l.no_peserta, l);
    } else {
      const currentPriority = priority[l.status] || 0;
      const existingPriority = priority[existing.status] || 0;

      // 🔥 AMBIL STATUS PALING KUAT
      if (currentPriority >= existingPriority) {
        latestMap.set(l.no_peserta, l);
      }
    }
  });

  // 🔥 5. GABUNG KE SISWA (ANTI RESET STATUS)
const result: Monitoring[] = siswa.map((s) => {
  const lap = latestMap.get(s.no_peserta);

  // 🔥 AMBIL DATA LAMA (ANTI RESET)
  const existing = peserta?.find(p => p.no_peserta === s.no_peserta);

  if (!lap) {
    return {
      no_peserta: s.no_peserta,
      nama_lengkap: s.nama_lengkap,
      status: existing?.status || "belum_login",
      pelanggaran: existing?.pelanggaran || 0,
    };
  }

  return {
    no_peserta: s.no_peserta,
    nama_lengkap: s.nama_lengkap,
    status: lap.status,
    pelanggaran: lap.pelanggaran ?? 0,
  };
});

  // 🔥 6. UPDATE UI
  setPeserta((prev) => {
  const mapPrev = new Map(prev.map(p => [p.no_peserta, p]));

  const priority: Record<string, number> = {
  selesai: 5,
  auto_submit: 5,
  sedang: 3,
  belum_login: 1,
};

  const finalData = result.map((r) => {
  const old = mapPrev.get(r.no_peserta);
  if (!old) return r;

  // 🔒 kalau sudah final → jangan pernah turun
  if (old.status === "selesai" || old.status === "auto_submit") {
    return old;
  }

  const newP = priority[r.status] ?? 0;
  const oldP = priority[old.status] ?? 0;

  if (newP < oldP) return old;
  return r;
});

  // 🔥 PINDAH KE SINI
  hitungStat(finalData);

  return finalData;
});
}

  
  
  async function mulaiUjian() {
  if (!selectedAsesmen) {
    alert("Pilih asesmen dulu");
    return;
  }

  const id = Number(selectedAsesmen);
  const sesiFix = Number(sesi);

  // 🔥 WAJIB ADA TOKEN DULU (VALIDASI)
  if (!token) {
    alert("Rilis token dulu!");
    return;
  }

  // ===============================
  // 🔥 MATIKAN SEMUA TOKEN LAMA (ANTI NYANGKUT)
  // ===============================
  const { error: errKill } = await supabase
    .from("token_ujian")
    .update({ status: false })
    .eq("id_asesmen", id)
    .eq("sesi", sesiFix);

  if (errKill) {
    console.log("❌ GAGAL MATIKAN TOKEN LAMA:", errKill.message);
    return;
  }

  // ===============================
  // 🔥 AKTIFKAN TOKEN YANG DIPILIH (YANG BARUSAN DIBUAT)
  // ===============================
  const { error: errActivate } = await supabase
    .from("token_ujian")
    .update({ status: true })
    .eq("id_asesmen", id)
    .eq("sesi", sesiFix)
    .eq("token", token);

  if (errActivate) {
    console.log("❌ GAGAL AKTIFKAN TOKEN:", errActivate.message);
    return;
  }

  // ===============================
  // 🔥 CEK / UPSERT UJIAN AKTIF
  // ===============================
  const { data: existing } = await supabase
    .from("ujian_aktif")
    .select("*")
    .eq("id_asesmen", id)
    .eq("sesi", sesiFix)
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
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix);

    error = res.error;
  } else {
    const res = await supabase
      .from("ujian_aktif")
      .insert({
        id_asesmen: id,
        waktu_mulai: new Date(),
        durasi_menit: durasi,
        status: "berjalan",
        sesi: sesiFix,
        jenis_sesi: jenisSesi
      });

    error = res.error;
  }

  // ===============================
  // 🔥 HANDLE RESULT
  // ===============================
  if (error) {
    console.log("❌ ERROR MULAI:", error.message, error.details);
    return;
  }

  alert("Ujian dimulai");

  // 🔥 SET STATE
  setUjianAktif(true);

  // 🔥 PENTING: jangan tampilkan token lama
  setToken("");

  loadPeserta();
}
  
 async function stopUjian() {
  if (!selectedAsesmen) return;

  const id = Number(selectedAsesmen);
  const sesiFix = Number(sesi);

  try {
    // ===============================
    // 1. STOP UJIAN
    // ===============================
    const { error: errUjian } = await supabase
      .from("ujian_aktif")
      .update({ status: "selesai" })
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix);

    if (errUjian) {
      console.log("❌ ERROR UJIAN:", errUjian);
      alert("Gagal stop ujian");
      return;
    }

    // ===============================
    // 2. DEBUG TOKEN SEBELUM
    // ===============================
    const { data: before } = await supabase
      .from("token_ujian")
      .select("*")
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix);

    console.log("🧪 TOKEN SEBELUM:", before);

    // ===============================
// 3. MATIKAN TOKEN (FIX UTAMA)
// ===============================
let killed: any[] | null = null;

// 🔥 1. COBA MATIKAN YANG MASIH AKTIF
const { data: killedActive, error: errToken1 } = await supabase
  .from("token_ujian")
  .update({ status: false })
  .eq("id_asesmen", id)
  .eq("sesi", sesiFix)
  .eq("status", true)
  .select();

if (errToken1) {
  console.log("❌ ERROR TOKEN (ACTIVE):", errToken1);
} else {
  killed = killedActive;
}

// 🔥 2. FALLBACK (PAKSA MATIKAN SEMUA)
const { data: killedAll, error: errToken2 } = await supabase
  .from("token_ujian")
  .update({ status: false })
  .eq("id_asesmen", id)
  .eq("sesi", sesiFix)
  .select();

if (errToken2) {
  console.log("❌ ERROR TOKEN (FALLBACK):", errToken2);
  alert("Gagal matikan token (cek RLS)");
  return;
}

// 🔥 FINAL RESULT (gabung debug)
console.log("🔻 TOKEN DIMATIKAN (ACTIVE):", killed);
console.log("🔻 TOKEN DIMATIKAN (ALL):", killedAll);
console.log("📊 TOTAL:", (killedAll?.length || 0));

    // ===============================
    // 4. VALIDASI (ANTI ILUSI)
    // ===============================
    const { data: after } = await supabase
      .from("token_ujian")
      .select("*")
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix);

    console.log("🧪 TOKEN SESUDAH:", after);

    const masihAktif = after?.filter(t => t.status === true);

    if (masihAktif && masihAktif.length > 0) {
      console.log("⚠️ MASIH ADA TOKEN AKTIF:", masihAktif);
      alert("Token gagal dimatikan (cek RLS / policy)");
      return;
    }

    // ===============================
    // 5. AUTO SUBMIT
    // ===============================
    const { error: errSubmit } = await supabase
      .from("laporan_ujian")
      .update({ status: "auto_submit" })
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix)
      .neq("status", "selesai");

    if (errSubmit) {
      console.log("❌ ERROR AUTO SUBMIT:", errSubmit);
    }

    // ===============================
    // 6. RESET UI (ANTI BALIK LAGI)
    // ===============================
    setUjianAktif(false);
    setToken("");

    // 🔥 HARD RESET (BIAR GAK KE-RELOAD DARI INTERVAL)
    setTimeout(() => {
      setToken("");
    }, 500);

    alert("Ujian dihentikan ✅");

  } catch (err) {
    console.log("❌ FATAL ERROR:", err);
  }
}

  


async function loadKonfigurasi() {
  if (!selectedAsesmen) return;

  const { data, error } = await supabase
    .from("ujian_aktif")
    .select("*")
    .eq("id_asesmen", selectedAsesmen)
    .eq("sesi", Number(sesi))
    .maybeSingle();

  if (error) {
    console.log("❌ ERROR KONFIG:", error.message, error.details);
    return;
  }

  // ===============================
  // ❌ TIDAK ADA DATA UJIAN
  // ===============================
  if (!data) {
    setUjianAktif(false);
    setToken(""); // 🔥 RESET TOKEN TOTAL
    setIsFirstLoad(true);
    return;
  }

  // ===============================
  // DATA ADA
  // ===============================
  const isRunning = data.status === "berjalan";

  setJenisSesi(data.jenis_sesi || "utama");
  setUjianAktif(isRunning);

  // 🔥 RESET TOKEN kalau tidak aktif
  if (!isRunning) {
    setToken("");
  }

  // ===============================
  // DURASI HANDLING
  // ===============================
  if (isFirstLoad || isRunning) {
    setDurasi(data.durasi_menit ?? 60);
  }

  setIsFirstLoad(false);
}

// ===============================
// LOAD TOKEN (FIX)
// ===============================
async function loadToken() {
  if (!selectedAsesmen) return;

  const id = Number(selectedAsesmen);
  const sesiFix = Number(sesi);

  try {
    const { data, error } = await supabase
      .from("token_ujian")
      .select("id, token, status, dibuat_pada, expired_at")
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix)
      .eq("status", true)
      .order("dibuat_pada", { ascending: false })
      .limit(1);

    if (error) {
      console.log("❌ TOKEN ERROR:", error.message, error.details);
      setToken("");
      return;
    }

    if (!data || data.length === 0) {
      setToken("");
      return;
    }

    const latest = data[0];
    const now = new Date();

    // ===============================
    // 🔥 1. ANTI ZOMBIE (EXPIRED)
    // ===============================
    if (latest.expired_at) {
      const expired = new Date(latest.expired_at);

      if (now > expired) {
        console.log("⛔ TOKEN EXPIRED → AUTO MATIKAN");

        const { error: errUpdate } = await supabase
          .from("token_ujian")
          .update({ status: false })
          .eq("id", latest.id)
          .eq("id_asesmen", id)   // 🔥 TAMBAHAN SAFETY
          .eq("sesi", sesiFix);

        if (errUpdate) {
          console.log("❌ GAGAL MATIKAN TOKEN EXPIRED:", errUpdate);
        }

        setToken("");
        return;
      }
    }

    // ===============================
    // 🔥 2. VALIDASI HARI (OPTIONAL)
    // ===============================
    const dibuat = new Date(latest.dibuat_pada);

    const isSameDay =
      dibuat.getDate() === now.getDate() &&
      dibuat.getMonth() === now.getMonth() &&
      dibuat.getFullYear() === now.getFullYear();

    if (!isSameDay) {
      console.log("⚠️ TOKEN LAMA (Beda Hari)");
      setToken("");
      return;
    }

    // ===============================
    // 🔥 3. VALIDASI UJIAN AKTIF
    // (BIAR TOKEN GAK MUNCUL SAAT STOP)
    // ===============================
    const { data: ujian } = await supabase
      .from("ujian_aktif")
      .select("status")
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix)
      .maybeSingle();

    if (!ujian || ujian.status !== "berjalan") {
      setToken("");
      return;
    }

    // ===============================
    // ✅ TOKEN VALID
    // ===============================
    setToken(latest.token);

  } catch (err) {
    console.log("❌ FATAL ERROR loadToken:", err);
    setToken("");
  }
}

// 🔥 AUTO LOAD TOKEN SETIAP BALIK / CHANGE STATE
useEffect(() => {
  if (ujianAktif) {
    loadToken();
  } else {
    setToken(""); // 🔥 INI YANG BIKIN KOSONG SAAT START BARU
  }
}, [ujianAktif, selectedAsesmen, sesi]);
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
  if (!selectedAsesmen) return;

  const init = async () => {
    setLoading(true);

    // 🔥 reset dulu (biar gak nyampur sesi lama)
    setPeserta([]);
    setToken("");
    setStatLogin(0);
    setStatSedang(0);
    setStatSelesai(0);
    setStatWarning(0);

    // 🔥 load data baru
    await loadPeserta();

    setLoading(false);
  };

  init();
}, [selectedAsesmen, sesi]);

useEffect(() => {
  if (!selectedAsesmen) return;

  const interval = setInterval(() => {
    loadPeserta();
    loadToken();

    // 🔥 HANYA SYNC SAAT UJIAN BERJALAN
    if (ujianAktif) {
      loadKonfigurasi();
    }
  }, 3000);

  return () => clearInterval(interval);
}, [selectedAsesmen, sesi, ujianAktif]);
  // ===============================
// REALTIME UPDATE
// ===============================

const priority: Record<string, number> = {
  selesai: 5,
  auto_submit: 5,
  sedang: 3,
  belum_login: 1,
};

// 🔥 TYPE FIX
type LaporanRealtime = {
  no_peserta: string;
  status: string;
  pelanggaran: number;
  sesi: number;
  id_asesmen: number;
};
useEffect(() => {
  if (!selectedAsesmen) return;

  const channel = supabase
    .channel(`monitoring-${selectedAsesmen}-${sesi}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "laporan_ujian",
        filter: `id_asesmen=eq.${selectedAsesmen}`,
      },
      (payload) => {
        const newData = payload.new as LaporanRealtime;
        if (!newData) return;

        if (Number(newData.sesi) !== Number(sesi)) return;

        setPeserta((prev) => {
          const updated = prev.map((p) => {
            if (p.no_peserta !== newData.no_peserta) return p;

            const currentPriority = priority[newData.status] || 0;
            const existingPriority = priority[p.status] || 0;

            if (currentPriority >= existingPriority) {
              return {
                ...p,
                status: newData.status,
                pelanggaran: newData.pelanggaran ?? 0,
              };
            }

            return p;
          });

          // 🔥 UPDATE STAT LANGSUNG (INI YANG BIKIN GAK PERLU RELOAD)
          hitungStat(updated);

          return updated;
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedAsesmen, sesi]);

  

  async function generateToken() {
  if (!selectedAsesmen) return;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  const id = Number(selectedAsesmen);
  const sesiFix = Number(sesi);

  const now = new Date();

  // ⏱️ TOKEN BERLAKU 10 MENIT
  const expired = new Date(now.getTime() + 10 * 60 * 1000);

  try {
    // ===============================
    // 🔥 1. MATIKAN TOKEN LAMA
    // ===============================
    const { error: errKill } = await supabase
      .from("token_ujian")
      .update({ status: false })
      .eq("id_asesmen", id)
      .eq("sesi", sesiFix);

    if (errKill) {
      console.log("❌ GAGAL MATIKAN TOKEN:", errKill);
      return;
    }

    // ===============================
    // 🔥 2. INSERT TOKEN BARU
    // ===============================
    const { data, error } = await supabase
      .from("token_ujian")
      .insert({
        id_asesmen: id,
        sesi: sesiFix,
        token: result,
        status: true,
        dibuat_pada: now,
        expired_at: expired, // 🔥 INI KUNCI ANTI ZOMBIE
      })
      .select()
      .single();

    if (error) {
      console.log("❌ INSERT TOKEN ERROR:", error.message);
      return;
    }

    // ===============================
    // 🔥 3. SET KE UI
    // ===============================
    setToken(data.token);

    console.log("✅ TOKEN BARU:", data);

  } catch (err) {
    console.log("❌ FATAL ERROR TOKEN:", err);
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
  .eq("id_asesmen", selectedAsesmen);

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

     <div className="col-span-1 space-y-6">

  {/* ⚙️ KONFIGURASI */}
  <div className="bg-white p-5 rounded-2xl shadow-lg border space-y-4">

    {/* HEADER */}
    <div className="flex justify-between items-center">
      <h2 className="font-bold text-lg">Konfigurasi Ujian</h2>

      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
        ujianAktif
          ? "bg-green-100 text-green-700"
          : "bg-gray-200 text-gray-600"
      }`}>
        {ujianAktif ? "● LIVE" : "● STOP"}
      </span>
    </div>

    {/* ASESMEN */}
    <div className="text-sm text-gray-600">
      Asesmen:
      <div className="font-semibold text-gray-800">
        {asesmen[0]?.nama_asesmen || "-"}
      </div>
    </div>

    {/* DURASI */}
    <div>
      <label className="text-xs text-gray-500">Durasi (menit)</label>
      <input
        type="number"
        disabled={ujianAktif}
        className="w-full border mt-1 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        value={durasi}
        onChange={(e) => setDurasi(Number(e.target.value))}
      />
    </div>

    {/* SESI */}
    <div>
      <label className="text-xs text-gray-500">Sesi Ujian</label>
      <select
        disabled={ujianAktif}
        className="w-full border mt-1 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        value={sesi}
        onChange={(e) => setSesi(Number(e.target.value))}
      >
        <option value={1}>Sesi 1 (Utama)</option>
        <option value={2}>Sesi 2 (Susulan)</option>
        <option value={3}>Sesi 3</option>
      </select>
    </div>

    {/* JENIS */}
    <div>
      <label className="text-xs text-gray-500">Jenis Sesi</label>
      <select
        disabled={ujianAktif}
        className="w-full border mt-1 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        value={jenisSesi}
        onChange={(e) => setJenisSesi(e.target.value)}
      >
        <option value="utama">Ujian Utama</option>
        <option value="susulan">Ujian Susulan</option>
      </select>
    </div>

    {/* TOKEN */}
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-xl text-center shadow-inner">
      <p className="text-xs opacity-70">TOKEN UJIAN</p>
      <div className="text-2xl font-mono tracking-widest mt-1">
        {token || "------"}
      </div>
    </div>

    {/* BUTTON TOKEN */}
    <button
      onClick={generateToken}
      disabled={ujianAktif}
      className={`w-full py-2 rounded-lg font-semibold transition ${
        ujianAktif
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 text-white shadow"
      }`}
    >
      🔐 RILIS TOKEN
    </button>

    {/* BUTTON START/STOP */}
    <button
      onClick={ujianAktif ? stopUjian : mulaiUjian}
      className={`w-full py-3 rounded-lg text-white font-bold transition shadow ${
        ujianAktif
          ? "bg-red-600 hover:bg-red-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {ujianAktif ? "⛔ STOP UJIAN" : "🚀 MULAI UJIAN"}
    </button>
  </div>

  {/* 📊 STATISTIK */}
  <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white p-5 rounded-2xl shadow-lg">
    <h2 className="font-bold mb-4 text-lg">Statistik</h2>

    <div className="grid grid-cols-2 gap-3 text-sm">

      <div className="bg-white/20 p-3 rounded-lg text-center">
        <p className="text-xs opacity-80">Login</p>
        <p className="text-lg font-bold">{statLogin}</p>
      </div>

      <div className="bg-white/20 p-3 rounded-lg text-center">
        <p className="text-xs opacity-80">Sedang</p>
        <p className="text-lg font-bold">{statSedang}</p>
      </div>

      <div className="bg-white/20 p-3 rounded-lg text-center">
        <p className="text-xs opacity-80">Selesai</p>
        <p className="text-lg font-bold">{statSelesai}</p>
      </div>

      <div className="bg-white/20 p-3 rounded-lg text-center">
        <p className="text-xs opacity-80">Warning</p>
        <p className="text-lg font-bold">{statWarning}</p>
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
