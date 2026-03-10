"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import SoalCard from "./components/SoalCard";

type Soal = {
  id: number;
  id_asesmen: number;
  pertanyaan: string;
  tipe: "pg" | "pgk" | "bs";
  pilihan: string[];
};

export default function UjianClient() {

  const params = useSearchParams();
  const id = params.get("id");

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

  const soalFix = data.map((s: any) => {

  let pilihan: string[] = [];

  if (Array.isArray(s.pilihan)) {
    pilihan = s.pilihan;
  }
  else if (typeof s.pilihan === "object" && s.pilihan !== null) {
    pilihan = Object.values(s.pilihan) as string[];
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

  const dataKirim = Object.entries(jawaban).map(([id_soal, jwb]) => ({
    id_soal: Number(id_soal),
    jawaban: jwb
  }));

  const { error } = await supabase
    .from("jawaban_peserta")
    .insert(dataKirim);

  if(error){
    alert("Submit gagal");
    console.log(error);
    return;
  }

  localStorage.removeItem("jawaban_ujian");

  alert("Ujian berhasil dikumpulkan");

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