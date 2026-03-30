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
};

export default function UjianClient() {

  const params = useSearchParams();
const id = params.get("id");
const router = useRouter();

  const [soal, setSoal] = useState<Soal[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jawaban, setJawaban] = useState<{[key:number]: string}>({});

  useEffect(() => {
    if (id) {
      loadSoal();
    }
  }, [id]);

useEffect(() => {

  const data = localStorage.getItem("jawaban_ujian");

  if(data){
    setJawaban(JSON.parse(data));
  }

},[]);

  async function loadSoal() {

    setLoading(true);

    const { data, error } = await supabase
      .from("bank_soal")
      .select("*")
      .eq("id_asesmen", id)
      .order("id");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

   if (data) {
	   console.log("DATA SOAL DARI DB:", data);

  const soalFix = data.map((s: any) => {

  let pilihan: string[] = [];

  if (Array.isArray(s.pilihan)) {
    pilihan = s.pilihan;
  }
  else if (typeof s.pilihan === "object" && s.pilihan !== null) {
  pilihan = Object.values(s.pilihan).map((v:any) =>
    typeof v === "string" ? v : v.text || ""
  );
}
  else if (typeof s.pilihan === "string") {
    try {
      const parsed = JSON.parse(s.pilihan);

      if (Array.isArray(parsed)) {
        pilihan = parsed;
      } else if (typeof parsed === "object") {
        pilihan = Object.values(parsed) as string[];
      }

    } catch {
      pilihan = [];
    }
  }

  return {
    ...s,
    pilihan
  };

});

  setSoal(soalFix);
}

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading soal...
      </div>
    );
  }

  if (soal.length === 0) {
    return (
      <div className="p-10 text-center">
        Soal belum tersedia
      </div>
    );
  }

  const s = soal[current] || null;

if (!s) {
  return (
    <div className="p-10 text-center">
      Soal tidak ditemukan
    </div>
  );
}
function simpanJawaban(idSoal:number, value:string){

  const baru = {
    ...jawaban,
    [idSoal]: value
  };

  setJawaban(baru);

  localStorage.setItem("jawaban_ujian", JSON.stringify(baru));
}

{/* kirim / submit jawaban */}
async function submitUjian(){

  const noPeserta = localStorage.getItem("no_peserta");

  if (!noPeserta) {
    alert("Peserta tidak ditemukan");
    return;
  }

  // =========================
  // 1. SIMPAN JAWABAN
  // =========================
  const dataKirim = Object.entries(jawaban).map(([id_soal, jwb]) => ({
    no_peserta: noPeserta,
    id_soal: Number(id_soal),
    id_asesmen: Number(id),
    jawaban: jwb
  }));

  const { error } = await supabase
  .from("jawaban_peserta")
  .upsert(dataKirim, {
    onConflict: "no_peserta,id_soal,id_asesmen"
  });

if (error) {
  console.log(error);
  alert(error.message);
  return;
}

  // =========================
  // 2. AMBIL KUNCI JAWABAN
  // =========================
  const { data: soalDB, error: errSoal } = await supabase
    .from("bank_soal")
    .select("id, kunci")
    .eq("id_asesmen", id);

  if(errSoal){
    console.log(errSoal);
    return;
  }

  // =========================
// 3. HITUNG NILAI
// =========================
let b = 0;
let s = 0;
let k = 0;

soalDB?.forEach((item) => {

  const jwb = jawaban[item.id];

  let kunci = item.kunci;

  try {
    if (typeof kunci === "string") {
      kunci = JSON.parse(kunci);
    }
  } catch {}

  function bersihin(text:any){
  return String(text || "")
    .replace(/^"+|"+$/g, "") // 🔥 hapus tanda kutip di awal & akhir
    .trim()
    .toLowerCase();
}

const jawabanUser = bersihin(jwb);
const kunciFinal = bersihin(kunci);

  if (!jawabanUser) {
    k++;
  } 
  else if (jawabanUser === kunciFinal) {
    b++;
  } 
  else {
    s++;
  }

});

// 🔥 INI YANG LO LUPA
const nilaiAkhir =
  soalDB && soalDB.length > 0
    ? Math.round((b / soalDB.length) * 100)
    : 0;

console.log("BENAR:", b);
console.log("SALAH:", s);
console.log("KOSONG:", k);
console.log("NILAI:", nilaiAkhir);


  // =========================
// 4. SIMPAN LAPORAN
// =========================

// 🔥 DEBUG: liat dulu datanya sebelum dikirim
console.log("KIRIM LAPORAN:", {
  id_asesmen: Number(id),
  no_peserta: noPeserta,
  nilai: nilaiAkhir,
  benar: b,
  salah: s,
  kosong: k,
});

const { error: errInsert } = await supabase
  .from("laporan_ujian")
  .upsert(
    {
      id_asesmen: Number(id),
      no_peserta: noPeserta,
      nilai: nilaiAkhir,
      benar: b,
      salah: s,
      kosong: k,
    },
    {
      onConflict: "no_peserta,id_asesmen",
    }
  );

// 🔥 HANDLE ERROR BIAR KELIATAN
if (errInsert) {
  console.log("❌ Gagal simpan laporan:", errInsert);
  alert("Gagal simpan laporan: " + errInsert.message);
} else {
  console.log("✅ Laporan berhasil disimpan");
}

  // =========================
  // 5. BERSIHIN & REDIRECT
  // =========================
  localStorage.removeItem("jawaban_ujian");

  router.push(`/peserta/hasil?id=${id}`);
}

  return (
  <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

    {/* SIDEBAR NOMOR SOAL - DESKTOP */}
    <div className="hidden md:block border rounded-lg p-4 bg-white shadow">

      <h2 className="font-bold mb-4 text-center">
        Nomor Soal
      </h2>

      <div className="grid grid-cols-5 gap-2">

        {soal.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`p-2 text-sm rounded transition
            ${
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

    {/* AREA SOAL */}
    <div className="md:col-span-3">

      <div className="bg-white shadow rounded-lg p-6">

        <h1 className="text-lg md:text-xl font-bold mb-6">
          Soal {current + 1} dari {soal.length}
        </h1>

        <SoalCard
  soal={s}
  value={jawaban[s.id] || ""}
  onChange={(v:string)=>simpanJawaban(s.id,v)}
/>

        {/* NAVIGASI */}
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
    onClick={submitUjian}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
  >
    Submit Ujian
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

      {/* NOMOR SOAL UNTUK HP */}
      <div className="md:hidden mt-6 border rounded-lg p-4 bg-white shadow">

        <h2 className="font-bold mb-3 text-center">
          Nomor Soal
        </h2>

        <div className="grid grid-cols-5 gap-2">

          {soal.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`p-2 text-sm rounded
              ${
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
);
}