"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPeserta() {
  const router = useRouter();

  const [noPeserta, setNoPeserta] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
  message: string;
  type: "error" | "warning";
} | null>(null);

 const handleLogin = async () => {
  setLoading(true);
  setError(null);

  if (!noPeserta || !password) {
    setError({
  message: "No peserta dan password wajib diisi",
  type: "error",
});
    setLoading(false);
    return;
  }

  const { data: siswa, error: errSiswa } = await supabase
  .from("data_siswa")
  .select("*")
  .eq("no_peserta", noPeserta)
  .maybeSingle();

  if (errSiswa) {
  console.log("ERROR SUPABASE:", errSiswa);

  setError({
    message: "Terjadi kesalahan saat login. Coba lagi.",
    type: "error",
  });

  setLoading(false);
  return;
}

if (!siswa) {
  setError({
    message: "No peserta tidak ditemukan",
    type: "error",
  });
  setLoading(false);
  return;
}

  if (siswa.password !== password) {
    setError({
  message: "Password salah",
  type: "error",
});
    setLoading(false);
    return;
  }

  if (!siswa.status) {
    setError({
  message: "Akun tidak aktif",
  type: "error",
});
    setLoading(false);
    return;
  }


// =========================
// 🔥 CEK UJIAN AKTIF
// =========================
const { data: ujian } = await supabase
  .from("ujian_aktif")
  .select("*")
  .eq("id_asesmen", 1) // ⚠️ nanti bisa dinamis
  .eq("sesi", 1)
  .maybeSingle();

if (!ujian || ujian.status !== "berlangsung") {
  setError({
    message: "Ujian belum dimulai atau sudah selesai",
    type: "warning",
  });
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
// =========================
// 🔒 FINAL LOCK (WAJIB)
// =========================
if (laporan && laporan.status_final === "auto_submit") {
  setError({
    message:
      "Waktu ujian sudah habis. Jawaban telah dikumpulkan otomatis.",
    type: "warning",
  });
  setLoading(false);
  return;
}

if (laporan && laporan.status_final === "selesai") {
  setError({
    message:
      "Ujian sudah selesai. Anda tidak dapat mengerjakan kembali.",
    type: "warning",
  });
  setLoading(false);
  return;
}

// =========================
// 🔒 HARD LOCK KOMBINASI
// =========================
if (
  !siswa.status &&
  laporan &&
  ["selesai", "auto_submit"].includes(laporan.status_final)
) {
  setError({
    message: "Akun tidak aktif dan ujian sudah selesai",
    type: "error",
  });
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
  if (!laporan || laporan.status_final !== "sedang") {
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
  ["sedang", "belum_login"].includes(laporan.status_final)
) { {
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
  <div
    className={`mb-4 p-4 rounded-lg border flex items-start gap-3 animate-fadeIn ${
      error.type === "error"
        ? "bg-red-50 border-red-300 text-red-700"
        : "bg-yellow-50 border-yellow-300 text-yellow-700"
    }`}
  >
    {/* ICON */}
    <div className="text-xl">
      {error.type === "error" ? "❌" : "⚠️"}
    </div>

    {/* TEXT */}
    <div>
      <p className="font-semibold">
        {error.type === "error" ? "Login Gagal" : "Peringatan"}
      </p>
      <p className="text-sm">{error.message}</p>
    </div>
  </div>
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
