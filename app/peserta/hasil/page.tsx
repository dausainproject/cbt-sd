"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function HasilContent() {

  const params = useSearchParams();
  const id = params.get("id");

  const [namaAsesmen, setNamaAsesmen] = useState("");

  // STATE NILAI
  const [nilai, setNilai] = useState(0);
  const [benar, setBenar] = useState(0);
  const [salah, setSalah] = useState(0);
  const [kosong, setKosong] = useState(0);

  // RINGKASAN
  const [ringkasan, setRingkasan] = useState<any[]>([]);

  useEffect(() => {

    async function loadAsesmen(){

      const { data, error } = await supabase
        .from("data_asesmen")
        .select("nama_asesmen")
        .eq("id", id)
        .single();

      if(data){
        setNamaAsesmen(data.nama_asesmen);
      }

      if(error){
        console.log(error);
      }

    }
const noPeserta = localStorage.getItem("no_peserta");
    async function hitungNilai() {

      // ambil soal
      const { data: soal, error: errSoal } = await supabase
        .from("bank_soal")
        .select("id, kunci")
        .eq("id_asesmen", id);

      if(errSoal){
        console.log(errSoal);
        return;
      }

      // ambil jawaban
      const { data: jawaban, error: errJawaban } = await supabase
        .from("jawaban_peserta")
.select("id_soal, jawaban")
.eq("id_asesmen", id)
.eq("no_peserta", noPeserta);

      if(errJawaban){
        console.log(errJawaban);
        return;
      }
console.log("Peserta:", noPeserta);
console.log("Jawaban:", jawaban);
      let b = 0;
      let s = 0;
      let k = 0;

      const detail: any[] = [];

      soal?.forEach((item, index) => {

        const jwb = jawaban?.find(j => j.id_soal === item.id);

        if (!jwb || !jwb.jawaban) {
          k++;
          detail.push({ no: index + 1, status: "kosong" });
        } 
        else if (JSON.stringify(jwb.jawaban) === JSON.stringify(item.kunci)) {
          b++;
          detail.push({ no: index + 1, status: "benar" });
        } 
        else {
          s++;
          detail.push({ no: index + 1, status: "salah" });
        }

      });

      const nilaiAkhir = soal && soal.length > 0
        ? Math.round((b / soal.length) * 100)
        : 0;

      setBenar(b);
      setSalah(s);
      setKosong(k);
      setNilai(nilaiAkhir);
      setRingkasan(detail);
    }

    if(id){
      loadAsesmen();
      hitungNilai();
    }

  },[id]);

  return (
    <div className="max-w-xl mx-auto p-10 text-center">

      <h1 className="text-2xl font-bold mb-6">
        Ujian Selesai
      </h1>

      <p className="text-lg font-semibold">
        {namaAsesmen}
      </p>

      <p className="mt-4">
        Terima kasih sudah mengerjakan ujian.
      </p>

      <p className="mt-4 text-gray-600">
        ID Asesmen: {id}
      </p>

      {/* CARD NILAI */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">

        <p className="text-gray-500 mb-2">
          Nilai Anda
        </p>

        <div className="text-5xl font-bold text-blue-600">
          {nilai}
        </div>

        <div className="text-gray-500">
          /100
        </div>

      </div>

      {/* CARD STATISTIK */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">

        <h2 className="font-semibold mb-4">
          Statistik Jawaban
        </h2>

        <div className="flex justify-between">

          <div>
            <p className="text-gray-500 text-sm">Benar</p>
            <p className="text-xl font-bold text-green-600">{benar}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Salah</p>
            <p className="text-xl font-bold text-red-600">{salah}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Kosong</p>
            <p className="text-xl font-bold text-gray-600">{kosong}</p>
          </div>

        </div>

      </div>

      {/* CARD RINGKASAN */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">

        <h2 className="font-semibold mb-4">
          Ringkasan Jawaban
        </h2>

        <div className="grid grid-cols-5 gap-2">

          {ringkasan.map((item, i) => (
            <div
              key={i}
              className={`p-2 rounded text-center text-white
                ${item.status === "benar" ? "bg-green-500" : ""}
                ${item.status === "salah" ? "bg-red-500" : ""}
                ${item.status === "kosong" ? "bg-gray-400" : ""}
              `}
            >
              {item.no}
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

export default function HasilPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <HasilContent />
    </Suspense>
  );
}