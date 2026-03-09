"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPeserta() {
  const router = useRouter();

  const [peserta, setPeserta] = useState<any>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("peserta");

    if (!data) {
      router.push("/peserta/login");
      return;
    }

    setPeserta(JSON.parse(data));
  }, []);

  const mulaiUjian = () => {
    if (!token) {
      alert("Masukkan token ujian!");
      return;
    }

    router.push("/peserta/ujian?token=" + token);
  };

  if (!peserta) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Dashboard Peserta
        </h1>

        <div className="mb-6 space-y-2">
          <p>
            <b>Nama :</b> {peserta.nama_lengkap}
          </p>

          <p>
            <b>Kelas :</b> {peserta.kelas}
          </p>

          <p>
            <b>No Peserta :</b> {peserta.no_peserta}
          </p>
        </div>

        <input
          type="text"
          placeholder="Masukkan Token Ujian"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full border p-3 rounded mb-4 text-center text-lg"
        />

        <button
          onClick={mulaiUjian}
          className="w-full bg-green-600 text-white p-3 rounded-lg text-lg hover:bg-green-700"
        >
          Mulai Ujian
        </button>

      </div>
    </div>
  );
}