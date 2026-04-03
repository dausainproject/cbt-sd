"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPeserta() {
  const router = useRouter();

  const [noPeserta, setNoPeserta] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    // =========================
    // VALIDASI INPUT
    // =========================
    if (!noPeserta || !password) {
      setError("No peserta dan password wajib diisi");
      setLoading(false);
      return;
    }

    const { data: siswa } = await supabase
  .from("data_siswa")
  .select("*")
  .eq("no_peserta", noPeserta)
  .single();

if (!siswa) {
  setError("No peserta tidak ditemukan");
  setLoading(false);
  return;
}

if (siswa.password !== password) {
  setError("Password salah");
  setLoading(false);
  return;
}

if (!siswa.status) {
  setError("Akun tidak aktif");
  setLoading(false);
  return;
}

    // =========================
    // BERSIHKAN DATA LAMA (PENTING)
    // =========================
    localStorage.removeItem("jawaban_ujian");

    // =========================
    // SIMPAN DATA PESERTA
    // =========================
   localStorage.setItem("peserta", JSON.stringify(siswa));
localStorage.setItem("no_peserta", siswa.no_peserta);

    // =========================
    // DEBUG (OPTIONAL)
    // =========================
    console.log("Login berhasil:", data);
    console.log("no_peserta disimpan:", data.no_peserta);

    // =========================
    // REDIRECT
    // =========================
    router.push("/peserta/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Login Peserta
        </h1>

        <input
          type="text"
          placeholder="No Peserta"
          value={noPeserta}
          onChange={(e) => setNoPeserta(e.target.value)}
          className="w-full border p-3 rounded mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded mb-4"
        />

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>

      </div>
    </div>
  );
}