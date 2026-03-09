"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SoalCard from "./components/soalcard";

type Soal = {
  id: number;
  pertanyaan: string;
  tipe: "pg" | "pgk" | "bs";
  pilihan: any[];
};

export default function UjianPage() {

  const [soal, setSoal] = useState<Soal[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    loadSoal();
  }, []);

  async function loadSoal() {

    const { data, error } = await supabase
      .from("soal")
      .select("*")
      .order("id");

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setSoal(data);
    }

  }

  if (soal.length === 0) {
    return (
      <div className="p-10 text-center">
        Loading soal...
      </div>
    );
  }

  const s = soal[current];

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