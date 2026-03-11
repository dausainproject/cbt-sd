"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function HasilContent() {

  const params = useSearchParams();
  const id = params.get("id");

  const [namaAsesmen, setNamaAsesmen] = useState("");

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

    if(id){
      loadAsesmen();
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

/* CARD STATISTIK */
<div className="mt-8 bg-white shadow rounded-lg p-6">
<div className="mt-6 bg-white shadow rounded-lg p-6">

  <h2 className="font-semibold mb-4">
    Statistik Jawaban
  </h2>

  <div className="flex justify-between">

    <div>
      <p className="text-gray-500 text-sm">Benar</p>
      <p className="text-xl font-bold text-green-600">17</p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">Salah</p>
      <p className="text-xl font-bold text-red-600">3</p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">Kosong</p>
      <p className="text-xl font-bold text-gray-600">0</p>
    </div>

  </div>

</div>

  <p className="text-gray-500 mb-2">
    Nilai Anda
  </p>

  <div className="text-5xl font-bold text-blue-600">
    85
  </div>

  <div className="text-gray-500">
    /100
  </div>

</div>

    </div>
	
<div className="mt-6 bg-white shadow rounded-lg p-6">

  <h2 className="font-semibold mb-4">
    Ringkasan Jawaban
  </h2>

  <div className="grid grid-cols-5 gap-2">

    <div className="p-2 rounded text-center bg-green-500 text-white">1</div>
    <div className="p-2 rounded text-center bg-green-500 text-white">2</div>
    <div className="p-2 rounded text-center bg-red-500 text-white">3</div>
    <div className="p-2 rounded text-center bg-green-500 text-white">4</div>
    <div className="p-2 rounded text-center bg-green-500 text-white">5</div>

    <div className="p-2 rounded text-center bg-green-500 text-white">6</div>
    <div className="p-2 rounded text-center bg-green-500 text-white">7</div>
    <div className="p-2 rounded text-center bg-green-500 text-white">8</div>
    <div className="p-2 rounded text-center bg-red-500 text-white">9</div>
    <div className="p-2 rounded text-center bg-green-500 text-white">10</div>

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