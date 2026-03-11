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