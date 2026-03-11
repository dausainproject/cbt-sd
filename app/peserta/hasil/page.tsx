"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function HasilContent() {

  const params = useSearchParams();
  const id = params.get("id");

  return (
    <div className="max-w-xl mx-auto p-10 text-center">

      <h1 className="text-2xl font-bold mb-6">
        Ujian Selesai
      </h1>

      <p>
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