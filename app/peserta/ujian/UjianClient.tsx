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
  pilihan: any[];
};

export default function UjianClient() {

  const params = useSearchParams();
  const id = params.get("id");

  const [soal, setSoal] = useState<Soal[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSoal();
    }
  }, [id]);

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
      setSoal(data);
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

  return (
    <div className="max-w-3xl mx-auto p-6">

      <h1 className="text-xl font-bold mb-6">
        Soal {current + 1} dari {soal.length}
      </h1>

      <SoalCard soal={s} />

      <div className="flex justify-between mt-10">

        <button
          onClick={() => setCurrent(current - 1)}
          disabled={current === 0}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Sebelumnya
        </button>

        <button
          onClick={() => setCurrent(current + 1)}
          disabled={current === soal.length - 1}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Berikutnya
        </button>

      </div>

    </div>
  );
}