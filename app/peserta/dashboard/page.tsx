"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardPeserta() {
  const router = useRouter();

  const [peserta, setPeserta] = useState<any>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("peserta");

    if (!data) {
      router.push("/peserta/login");
      return;
    }

    setPeserta(JSON.parse(data));
  }, []);

  const mulaiUjian = async () => {
    if (!token) {
      alert("Masukkan token ujian!");
      return;
    }

    setLoading(true);

    // cek token di Supabase
    const { data, error } = await supabase
      .from("token_ujian")
      .select("*")
      .eq("token", token)
      .eq("status", true)
      .single();

    if (error || !data) {
      alert("Token ujian tidak valid!");
      setLoading(false);
      return;
    }

    // cek apakah ujian sedang aktif
    const { data: ujianAktif } = await supabase
      .from("ujian_aktif")
      .select("*")
      .eq("id_asesmen", data.id_asesmen)
      .eq("status", "sedang")
      .single();

    if (!ujianAktif) {
      alert("Ujian belum dimulai!");
      setLoading(false);
      return;
    }

    // masuk halaman ujian
    router.push("/peserta/ujian?id=" + data.id_asesmen);
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
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded-lg text-lg hover:bg-green-700"
        >
          {loading ? "Memeriksa..." : "Mulai Ujian"}
        </button>

      </div>
    </div>
  );
}