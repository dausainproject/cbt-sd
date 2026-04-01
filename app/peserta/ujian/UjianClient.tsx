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
  const [submitting, setSubmitting] = useState(false);

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

// --- NORMALISASI JAWABAN & KUNCI ---
function normalizeAnswer(val: any) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).toLowerCase().trim()).sort();
  if (typeof val === "object") return Object.values(val).map(v => String(v).toLowerCase().trim()).sort();
  // ganti "|" jadi array, hapus tanda petik
  if (typeof val === "string") return val.replace(/"/g,"").split("|").map(v=>v.toLowerCase().trim()).sort();
  return [String(val).toLowerCase().trim()];
}



{/* kirim / submit jawaban */}
async function submitUjian() {
  if (submitting) return;
  setSubmitting(true);

  const noPeserta = localStorage.getItem("no_peserta");
  if (!noPeserta || noPeserta === "null" || noPeserta === "undefined") {
    alert("No peserta tidak valid");
    setSubmitting(false);
    return;
  }

  // 1. Simpan jawaban detail
  const dataKirim = Object.entries(jawaban).map(([id_soal, jwb]) => ({
    no_peserta: noPeserta,
    id_soal: Number(id_soal),
    id_asesmen: Number(id),
    jawaban: jwb,
    sesi: 1,
    ragu: false
  }));

  await supabase
    .from("jawaban_peserta")
    .upsert(dataKirim, { onConflict: "no_peserta,id_soal,id_asesmen" });

  // 2. Ambil kunci
  const { data: soalDB, error: errSoal } = await supabase
    .from("bank_soal")
    .select("id, kunci")
    .eq("id_asesmen", id);

  if (errSoal || !soalDB) {
    alert("Gagal ambil kunci");
    setSubmitting(false);
    return;
  }

  // --- 3. Hitung benar, salah, kosong ---
  let b = 0; // jumlah benar
  let s = 0; // jumlah salah
  let k = 0; // jumlah kosong

  soalDB.forEach(item => {
    const jwbRaw = jawaban[item.id]; // jawaban user
    const kunciRaw = item.kunci;     // kunci soal

    const userArr = normalizeAnswer(jwbRaw);
    const kunciArr = normalizeAnswer(kunciRaw);

    if (userArr.length === 0) {
      k++; // kosong
    } else if (JSON.stringify(userArr) === JSON.stringify(kunciArr)) {
      b++; // benar
    } else {
      s++; // salah
    }
  });

  const nilaiAkhir = soalDB.length > 0 ? Math.round((b / soalDB.length) * 100) : 0;

  // --- 4. Simpan laporan ---
  const { error: errInsert } = await supabase.from("laporan_ujian").upsert({
    id_asesmen: Number(id),
    no_peserta: String(noPeserta),
    nilai: nilaiAkhir,
    jumlah_benar: b,
    jumlah_salah: s,
    jumlah_kosong: k,
    status: "selesai",
    selesai_pada: new Date().toISOString(),
  }, { onConflict: "no_peserta,id_asesmen" });

  if (!errInsert) {
    localStorage.removeItem("jawaban_ujian");
    router.push(`/peserta/hasil?id=${id}`);
  } else {
    alert("Gagal simpan laporan");
  }

  setSubmitting(false);
}