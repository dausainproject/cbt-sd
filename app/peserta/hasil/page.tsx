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
	
	async function loadHasil() {
  const noPeserta = localStorage.getItem("no_peserta");

  if (!noPeserta) {
    console.log("no_peserta tidak ditemukan");
    return;
  }

  const { data, error } = await supabase
    .from("laporan_ujian")
    .select("*")
    .eq("id_asesmen", id)
    .eq("no_peserta", noPeserta)
    .single();

  if (error || !data) {
    console.log(error);
    return;
  }

  // 🔥 SET STATE DARI DB
  setNilai(data.nilai);
  setBenar(data.jumlah_benar_soal); // jumlah soal benar
  setSalah(data.jumlah_salah);
  setKosong(data.jumlah_kosong);

  // (opsional kalau mau ringkasan nanti)
}
	
	
const noPeserta = localStorage.getItem("no_peserta");
if (!noPeserta) {
  console.log("no_peserta tidak ditemukan");
  return;
}
    
	
	
	

    if(id){
  loadAsesmen();
  loadHasil();
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