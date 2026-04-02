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
  const [sisaWaktu, setSisaWaktu] = useState<number>(0);
  const [sesi, setSesi] = useState(1);
  const [ujianAktif, setUjianAktif] = useState(false);
const [jenisSesi, setJenisSesi] = useState("utama");

  // ===============================
  // LOAD KELAS
  // ===============================

  useEffect(() => {
    
    loadAsesmen();
  }, []);

  
  // ===============================
  // LOAD ASESMEN
  // ===============================

  async function loadAsesmen() {
    const { data } = await supabase
      .from("data_asesmen")
      .select("*");

    if (data) setAsesmen(data);
  }

  // ===============================
  // LOAD PESERTA
  // ===============================

  async function loadPeserta() {
    const { data: siswa } = await supabase
  .from("data_siswa")
  .select("no_peserta,nama_lengkap")
  .eq("status", "aktif");

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

  // reset timer di dashboard
  setSisaWaktu(0);

  alert("Ujian dihentikan");
  setUjianAktif(false);

  // refresh peserta
  loadPeserta();
}

  // ===============================
  // STATISTIK
  // ===============================

  function hitungStat(data: Monitoring[]) {
    setStatLogin(data.filter((p) => p.status !== "belum_login").length);
    setStatSedang(data.filter((p) => p.status === "sedang").length);
    setStatSelesai(data.filter((p) => p.status === "selesai").length);
    setStatWarning(data.filter((p) => p.pelanggaran > 0).length);
  }

 useEffect(() => {
  loadPeserta();
}, [selectedAsesmen]);

  // ===============================
  // REALTIME UPDATE
  // ===============================

  useEffect(() => {
    const channel = supabase
      .channel("monitoring")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laporan_ujian" },
        () => {
          loadPeserta();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAsesmen]);

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

  setToken(result);

  if (selectedAsesmen) {
    const { data, error } = await supabase
      .from("token_ujian")
      .insert({
        id_asesmen: selectedAsesmen,
        token: result,
        status: true,
      });

    if (error) {
      console.log("Error Supabase:", error);
    } else {
      console.log("Token berhasil dibuat:", data);
    }
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

    if (status === "selesai")
      return <span className="bg-green-200 text-green-800 px-2 py-1 rounded">Selesai</span>;

    return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Belum Login</span>;
  }




useEffect(() => {
  if (!selectedAsesmen) return;

  let interval: any;

  const ambilWaktu = async () => {
    const { data } = await supabase
      .from("ujian_aktif")
      .select("waktu_mulai,durasi_menit,status")
      .eq("id_asesmen", selectedAsesmen)
      .eq("sesi", sesi)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return;

    // hanya jalan kalau ujian sedang berlangsung
    if (data.status !== "berjalan") {
      setSisaWaktu(0);
      return;
    }

    const mulai = new Date(data.waktu_mulai).getTime();
    const selesai = mulai + data.durasi_menit * 60 * 1000;

    interval = setInterval(() => {
      const sekarang = Date.now();
      const sisa = Math.floor((selesai - sekarang) / 1000);

      if (sisa <= 0) {
        setSisaWaktu(0);
        clearInterval(interval);
      } else {
        setSisaWaktu(sisa);
      }
    }, 1000);
  };

  ambilWaktu();

  return () => {
    if (interval) clearInterval(interval);
  };
}, [selectedAsesmen, sesi, ujianAktif]);

  // ===============================
  // UI
  // ===============================

  return (
    <div className="p-6 grid grid-cols-3 gap-6">

      {/* LEFT SIDE */}
      <div className="col-span-1 space-y-6">

        {/* KONFIGURASI */}
<div className="bg-white p-4 rounded shadow">
  <h2 className="font-bold mb-4">Konfigurasi Ujian</h2>

  
  <label className="text-sm">Pilih Asesmen</label>
  <select
    className="w-full border p-2 mb-3"
    onChange={(e) => setSelectedAsesmen(Number(e.target.value))}
  >
    <option value="">-- pilih asesmen --</option>
    {asesmen.map((a) => (
      <option key={a.id} value={a.id}>
        {a.nama_asesmen}
      </option>
    ))}
  </select>

  <label className="text-sm">Durasi</label>
  <input
    type="number"
    className="w-full border p-2 mb-3"
    value={durasi}
    onChange={(e) => setDurasi(Number(e.target.value))}
  />


<label className="text-sm">Sesi Ujian</label>
<select
  className="w-full border p-2 mb-3"
  value={sesi}
  onChange={(e) => setSesi(Number(e.target.value))}
>
  <option value={1}>Sesi 1 (Utama)</option>
  <option value={2}>Sesi 2 (Susulan)</option>
  <option value={3}>Sesi 3</option>
</select>

<label className="text-sm">Jenis Sesi</label>
<select
  className="w-full border p-2 mb-3"
  value={jenisSesi}
  onChange={(e) => setJenisSesi(e.target.value)}
>
  <option value="utama">Ujian Utama</option>
  <option value="susulan">Ujian Susulan</option>
</select>


  <input
    value={token}
    readOnly
    className="border p-2 w-full mb-3"
    placeholder="TOKEN"
  />

  <button
  onClick={generateToken}
  disabled={ujianAktif}
  className={`w-full py-2 rounded mb-3 text-white ${
    ujianAktif
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  RILIS TOKEN
</button>

  <button
  onClick={ujianAktif ? stopUjian : mulaiUjian}
  className={`w-full py-2 rounded text-white ${
    ujianAktif
      ? "bg-red-600 hover:bg-red-700"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  {ujianAktif ? "STOP UJIAN" : "MULAI UJIAN"}
</button>
</div>

{/* COUNTDOWN UJIAN */}
<div className="bg-sky-600 text-white p-4 rounded shadow text-center">
  <p className="text-sm opacity-90">SISA WAKTU UJIAN</p>

  <p className="text-3xl font-bold tracking-widest mt-1">
    {Math.floor(sisaWaktu / 3600)
      .toString()
      .padStart(2, "0")}
    :
    {Math.floor((sisaWaktu % 3600) / 60)
      .toString()
      .padStart(2, "0")}
    :
    {(sisaWaktu % 60).toString().padStart(2, "0")}
  </p>
</div>

        {/* STATISTIK */}
<div className="bg-sky-500 text-white p-4 rounded shadow">
  <h2 className="font-bold mb-3">Statistik</h2>

  <div className="grid grid-cols-2 gap-2 text-sm">

    <div className="bg-white/20 p-2 rounded">
      Login : {statLogin}
    </div>

    <div className="bg-white/20 p-2 rounded">
      Sedang Ujian : {statSedang}
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
    selesai: 3
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