
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import SoalCard from "./components/SoalCard";

type Soal = {
  id: number;
  id_asesmen: number;
  pertanyaan: string;
  tipe: "pg" | "pgk" | "bs" | "bs_kompleks";
  pilihan: string[];
  gambar?: string | null; // 🔥 TAMBAH INI
};

export default function UjianClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();

  const [sesi, setSesi] = useState(1); // ✅ state

  const [soal, setSoal] = useState<Soal[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jawaban, setJawaban] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusInserted, setStatusInserted] = useState(false);
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [namaPeserta, setNamaPeserta] = useState("");
  const [namaAsesmen, setNamaAsesmen] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ✅ WAJIB ADA INI
  useEffect(() => {
    const s = Number(localStorage.getItem("sesi") || 1);
    setSesi(s);
  }, []);


useEffect(() => {
  if (!id) return;

  const key = "start_time_" + id;
  const existing = localStorage.getItem(key);

  if (!existing) {
    const now = Date.now();
    localStorage.setItem(key, now.toString());
    console.log("⏱️ start disimpan:", now);
  }
}, [id]);


useEffect(() => {
  const fetchTimer = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("ujian_aktif")
      .select("durasi_menit")
      .eq("id_asesmen", id)
      .eq("status", "berjalan")
      .single();

    if (error || !data) {
      console.log("❌ Gagal ambil durasi");
      return;
    }

    const start = Number(localStorage.getItem("start_time_" + id));
    if (!start) return;

    const durasiMs = data.durasi_menit * 60 * 1000;
    const selesai = start + durasiMs;

    console.log("START:", start);
    console.log("SELESAI:", selesai);

    setEndTime(selesai);
  };

  fetchTimer();
}, [id]);


// TIMER
useEffect(() => {
  if (!endTime) return;

  const interval = setInterval(() => {
    const now = Date.now();
    const sisaMs = endTime - now;

    if (sisaMs <= 0) {
      clearInterval(interval);
      handleAutoSubmit();
    } else {
      setSisaWaktu(Math.floor(sisaMs / 1000));
    }
  }, 1000);

  return () => clearInterval(interval);
}, [endTime]);


// 🔥 AUTO FULLSCREEN (TARO DI SINI)
useEffect(() => {
  const goFullscreen = () => {
    const el = document.documentElement;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
  };

  document.addEventListener("click", goFullscreen, { once: true });

  return () => {
    document.removeEventListener("click", goFullscreen);
  };
}, []);




  // AMBIL DATA PESERTA + ASESMEN
useEffect(() => {
  const fetchHeader = async () => {
    const noPeserta = localStorage.getItem("no_peserta");

    if (noPeserta) {
      const { data: siswa } = await supabase
        .from("data_siswa")
        .select("nama_lengkap")
        .eq("no_peserta", noPeserta)
        .single();

      if (siswa) setNamaPeserta(siswa.nama_lengkap);
    }

    if (id) {
      const { data: asesmen } = await supabase
        .from("data_asesmen")
        .select("nama_asesmen")
        .eq("id", id)
        .single();

      if (asesmen) setNamaAsesmen(asesmen.nama_asesmen);
    }
  };

  fetchHeader();
}, [id]);

// DETEKSI FULLSCREEN
  useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  document.addEventListener("fullscreenchange", handleFullscreenChange);

  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  };
}, []);


  
  // 🔥 INSERT STATUS SAAT MULAI UJIAN
useEffect(() => {
  const insertStatus = async () => {
    if (!id || !sesi || statusInserted) return;

    const noPeserta = localStorage.getItem("no_peserta");
    if (!noPeserta) {
      console.log("NO PESERTA BELUM ADA");
      return;
    }

    console.log("COBA INSERT STATUS:", {
      id,
      sesi,
      noPeserta
    });

    const { error } = await supabase
  .from("laporan_ujian")
  .upsert(
    {
      no_peserta: noPeserta,
      id_asesmen: Number(id),
      sesi: sesi,
      status: "sedang",
      pelanggaran: 0
    },
    {
      onConflict: "no_peserta,id_asesmen,sesi"
    }
  );

if (error) {
  console.log("❌ ERROR DETAIL:", error);
}
  };

  insertStatus();
}, [id, sesi, statusInserted]);

  // Load jawaban dari localStorage
  useEffect(() => {
  const data = localStorage.getItem("jawaban_ujian");
  if (data) setJawaban(JSON.parse(data));
}, []);

// 🔥 WAJIB INI
useEffect(() => {
  if (id) {
    loadSoal();
  }
}, [id]);

  

async function loadSoal() {
  setLoading(true);

  const idNumber = Number(id); // 🔥 fix penting

  const { data, error } = await supabase
    .from("bank_soal")
    .select("*")
    .eq("id_asesmen", idNumber)
    .order("id");

  // 🔥 DEBUG
  console.log("ID:", idNumber);
  console.log("HASIL:", data);
  console.log("ERROR:", error);

  if (error) {
    console.error(error);
    setLoading(false);
    return;
  }

  if (data) {
    const soalFix = data.map((s: any) => {
      let pilihan: string[] = [];

      if (Array.isArray(s.pilihan)) pilihan = s.pilihan;

      else if (typeof s.pilihan === "object" && s.pilihan !== null)
        pilihan = Object.values(s.pilihan).map((v: any) =>
          typeof v === "string" ? v : v.text || ""
        );

      else if (typeof s.pilihan === "string") {
        try {
          const parsed = JSON.parse(s.pilihan);
          if (Array.isArray(parsed)) pilihan = parsed;
          else if (typeof parsed === "object")
            pilihan = Object.values(parsed) as string[];
        } catch {
          pilihan = [];
        }
      }

      return { ...s, pilihan, gambar: s.gambar };
    });

    setSoal(soalFix);
  }

  setLoading(false);
}

  function simpanJawaban(idSoal: number, value: string) {
    const baru = { ...jawaban, [idSoal]: value };
    setJawaban(baru);
    localStorage.setItem("jawaban_ujian", JSON.stringify(baru));
  }

  function normalizeAnswer(val: any) {
  if (!val) return [];

  if (Array.isArray(val)) {
    return val.map(v => String(v).toLowerCase().trim()).sort();
  }

  if (typeof val === "object") {
    return Object.values(val)
      .map(v => String(v).toLowerCase().trim())
      .sort();
  }

  if (typeof val === "string") {
    return val
      .replace(/"/g, "")
      .split("|")
      .map(v => v.split("_")[0]) // 🔥 BUANG _0 _1
      .map(v => v.toLowerCase().trim())
      .sort();
  }

  return [String(val).toLowerCase().trim()];
}

function formatWaktu(totalDetik: number) {
  const jam = Math.floor(totalDetik / 3600);
  const menit = Math.floor((totalDetik % 3600) / 60);
  const detik = totalDetik % 60;
  return `${jam.toString().padStart(2,"0")}:${menit.toString().padStart(2,"0")}:${detik.toString().padStart(2,"0")}`;
}
  
async function handleAutoSubmit() {
  if (submitting) return;

  console.log("⏰ AUTO SUBMIT TERJALAN");

  setTimeout(() => {
    submitUjian(true);
  }, 300); // kasih napas
}  
  async function submitUjian(isAuto = false) {
  if (submitting) return;
  setSubmitting(true);

  try {
    // 🔥 ambil jawaban terbaru
    const saved = localStorage.getItem("jawaban_ujian");
    const jawabanFix = saved ? JSON.parse(saved) : {};

    const noPeserta = localStorage.getItem("no_peserta");
    if (!noPeserta || noPeserta === "null" || noPeserta === "undefined") {
      alert("No peserta tidak valid");
      setSubmitting(false);
      return;
    }

    // ✅ 1. ambil soal
    const { data: soalDB, error: errSoal } = await supabase
      .from("bank_soal")
      .select("id, kunci, bobot, tipe")
      .eq("id_asesmen", Number(id));

    if (errSoal || !soalDB) {
      alert("Gagal ambil kunci");
      setSubmitting(false);
      return;
    }

    // ✅ 2. hitung nilai
    let totalBobot = 0;
    let jumlahSalah = 0;
    let jumlahKosong = 0;
    let benarSoal = 0;

    const dataKirim = soalDB.map(item => {
      const jwbRaw = jawabanFix[item.id];

      const userArr = normalizeAnswer(jwbRaw);
      const kunciArr = normalizeAnswer(item.kunci);

      const bobot = item.bobot || 1;
      totalBobot += bobot;

      let point = 0;

      if (userArr.length === 0) {
        jumlahKosong++;
      } else {
        if (item.tipe === "pg" || item.tipe === "bs") {
          if (JSON.stringify(userArr) === JSON.stringify(kunciArr)) {
            point = bobot;
            benarSoal++;
          } else {
            jumlahSalah++;
          }
        }

        else if (item.tipe === "pgk") {
          let benarCount = 0;

          kunciArr.forEach(k => {
            if (userArr.includes(k)) benarCount++;
          });

          point = benarCount;

          if (benarCount > 0) benarSoal++;
          else jumlahSalah++;
        }

        else if (item.tipe === "bs_kompleks") {
          let benarCount = 0;

          for (let i = 0; i < kunciArr.length; i++) {
            if (userArr[i] === kunciArr[i]) benarCount++;
          }

          point = benarCount;

          if (benarCount > 0) benarSoal++;
          else jumlahSalah++;
        }
      }

      return {
        no_peserta: noPeserta,
        id_soal: item.id,
        id_asesmen: Number(id),
        jawaban: jwbRaw ?? null,
        point: point,
        sesi: sesi,
        ragu: false
      };
    });

    // ✅ 3. simpan jawaban
    const { error: errJawaban } = await supabase
      .from("jawaban_peserta")
      .upsert(dataKirim, {
        onConflict: "no_peserta,id_asesmen,id_soal",
      });

    if (errJawaban) {
      console.log("❌ FULL ERROR:", JSON.stringify(errJawaban, null, 2));
      alert(
        "Gagal simpan jawaban:\n" +
        errJawaban.message +
        "\nCODE: " + errJawaban.code
      );
      setSubmitting(false);
      return;
    }

    // ✅ 4. hitung nilai akhir
    const totalPoint = dataKirim.reduce(
      (sum, item) => sum + (item.point || 0),
      0
    );

    const nilaiAkhir =
      totalBobot > 0
        ? (totalPoint / totalBobot) * 100
        : 0;

    // ✅ 5. simpan laporan
    const { error: errInsert } = await supabase
      .from("laporan_ujian")
      .upsert(
        {
          id_asesmen: Number(id),
          no_peserta: String(noPeserta),
          nilai: nilaiAkhir,
          jumlah_benar: totalPoint,
          jumlah_benar_soal: benarSoal,
          jumlah_salah: jumlahSalah,
          jumlah_kosong: jumlahKosong,
          status: isAuto ? "auto_submit" : "selesai",
          sesi: sesi,
          selesai_pada: new Date().toISOString(),
        },
        { onConflict: "no_peserta,id_asesmen,sesi" }
      );

    if (errInsert) {
      console.log("❌ Gagal simpan laporan:", errInsert);
      alert("Gagal simpan laporan");
      setSubmitting(false);
      return;
    }

    // ✅ 6. bersihin
    localStorage.removeItem("jawaban_ujian");
    localStorage.removeItem("start_time_" + id);

    // ✅ 7. redirect
    router.push(`/peserta/hasil?id=${id}`);

  } catch (err) {
    console.error("❌ ERROR SUBMIT:", err);
    alert("Terjadi kesalahan saat submit");
  } finally {
    setSubmitting(false);
  }
}

  

  if (loading) return <div className="p-10 text-center">Loading soal...</div>;
  if (soal.length === 0) return <div className="p-10 text-center">Soal belum tersedia</div>;

  const s = soal[current];
  if (!s) return <div className="p-10 text-center">Soal tidak ditemukan</div>;

 return (
  <>
    {/* 🔥 HEADER */}
<div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow border-b px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
  
  {/* 🔹 KIRI */}
  <div className="min-w-0">
    <p className="font-semibold text-sm md:text-base truncate">
      {namaPeserta || "Peserta"}
    </p>
    <p className="text-[11px] md:text-sm text-gray-500 truncate">
      {namaAsesmen || "Ujian"}
    </p>
  </div>

  {/* 🔹 TENGAH (TIMER) */}
  <div className="flex-1 text-center">
    <p className="text-[10px] md:text-xs text-gray-500">
      Sisa Waktu
    </p>
    <p className="text-lg md:text-2xl font-bold text-red-600 tracking-widest">
      {formatWaktu(sisaWaktu)}
    </p>
  </div>

  {/* 🔹 KANAN */}
  <div className="flex flex-col items-end gap-1">

    {/* STATUS */}
    <div className="text-right">
      <p className="text-[10px] md:text-xs text-gray-500">Mode</p>
      <p
        className={`font-bold text-[11px] md:text-sm ${
          isFullscreen ? "text-green-600" : "text-red-600"
        }`}
      >
        {isFullscreen ? "Fullscreen" : "Normal"}
      </p>
    </div>

    {/* 🔥 BUTTON FULLSCREEN */}
    <button
      onClick={() => {
        const el = document.documentElement;

        if (!document.fullscreenElement) {
          el.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }}
      className="bg-black text-white px-2 py-1 rounded text-[10px] md:text-xs active:scale-95"
    >
      {isFullscreen ? "Keluar" : "Fullscreen"}
    </button>

  </div>
</div>

    {/* 🔥 KONTEN UTAMA */}
    <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Sidebar nomor soal */}
      <div className="hidden md:block border rounded-lg p-4 bg-white shadow">
        <h2 className="font-bold mb-4 text-center">Nomor Soal</h2>
        <div className="grid grid-cols-5 gap-2">
          {soal.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`p-2 text-sm rounded transition ${
                i === current
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Area soal */}
      <div className="md:col-span-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-lg md:text-xl font-bold mb-6">
            Soal {current + 1} dari {soal.length}
          </h1>

          <SoalCard
            soal={s}
            value={jawaban[s.id] || ""}
            onChange={(v) => simpanJawaban(s.id, v)}
          />

          <div className="flex justify-between mt-10">
            <button
              onClick={() => setCurrent(current - 1)}
              disabled={current === 0}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
            >
              Sebelumnya
            </button>

            {current === soal.length - 1 ? (
              <button
                onClick={() => submitUjian(false)}
                disabled={submitting}
                className={`px-6 py-2 rounded text-white ${
                  submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting ? "Mengirim..." : "Submit Ujian"}
              </button>
            ) : (
              <button
                onClick={() => setCurrent(current + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Berikutnya
              </button>
            )}
          </div>
        </div>

        {/* Nomor soal HP */}
        <div className="md:hidden mt-6 border rounded-lg p-4 bg-white shadow">
          <h2 className="font-bold mb-3 text-center">Nomor Soal</h2>
          <div className="grid grid-cols-5 gap-2">
            {soal.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`p-2 text-sm rounded ${
                  i === current
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

}
