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
  // 🔥 CEK STATUS UJIAN
  // =========================
  const { data: laporan } = await supabase
    .from("laporan_ujian")
    .select("*")
    .eq("no_peserta", siswa.no_peserta)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // =========================
  // 🔥 LOGIC RESUME
  // =========================
  // =========================
// 🔥 CEK STATUS FINAL (LOCK)
// =========================
if (
  laporan &&
  (laporan.status_final === "selesai" ||
   laporan.status_final === "auto_submit")
) {
  setError("Anda sudah menyelesaikan ujian");
  setLoading(false);
  return;
}

  // =========================
  // 🔥 SIMPAN SESSION
  // =========================
  localStorage.setItem("peserta", JSON.stringify(siswa));
  localStorage.setItem("no_peserta", siswa.no_peserta);

  // =========================
  // 🔥 JANGAN HAPUS JAWABAN kalau sedang ujian
  // =========================
  if (!laporan || laporan.status !== "sedang") {
    localStorage.removeItem("jawaban_ujian");
  }

  // =========================
  // 🔥 UPDATE STATUS JADI SEDANG
  // =========================
 // =========================
// 🔥 JANGAN OVERWRITE YANG SUDAH SELESAI
// =========================
if (
  !laporan ||
  laporan.status_final === "sedang" ||
  laporan.status_final === "belum_login"
) {
  await supabase
    .from("laporan_ujian")
    .upsert(
      {
        no_peserta: siswa.no_peserta,
        id_asesmen: laporan?.id_asesmen || 1,
        sesi: laporan?.sesi || 1,
        status: "sedang",
        status_final: "sedang",
        pelanggaran: laporan?.pelanggaran || 0,
      },
      {
        onConflict: "no_peserta,id_asesmen,sesi",
      }
    );
}

  console.log("Login/resume:", siswa.no_peserta);

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
