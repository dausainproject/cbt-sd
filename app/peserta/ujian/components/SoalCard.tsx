"use client";

type Soal = {
  id: number;
  pertanyaan: string;
  tipe: "pg" | "pgk" | "bs" | "bs_kompleks";
  pilihan?: string[];
  gambar?: string | null; // 🔥 TAMBAH INI
};

type Props = {
  soal: Soal;
  value: string;
  onChange: (v: string) => void;
};

export default function SoalCard({ soal, value, onChange }: Props) {

  return (
    <div>

      <div className="mb-6">

  {/* 🔥 GAMBAR */}
  {soal.gambar && (
  <div className="mb-4 flex justify-center">
    <img
      src={soal.gambar}
      alt="gambar soal"
      className="w-full max-w-md max-h-[250px] md:max-h-[320px] object-contain rounded-lg border"
    />
  </div>
)}

  {/* 🔥 PERTANYAAN */}
  <div className="text-base md:text-lg leading-relaxed">
    {soal.pertanyaan}
  </div>

</div>

      {soal.tipe === "pg" && <SoalPG soal={soal} value={value} onChange={onChange} />}
{soal.tipe === "pgk" && <SoalPGK soal={soal} value={value} onChange={onChange} />}
{(soal.tipe === "bs" || soal.tipe === "bs_kompleks") && (
  <SoalBS soal={soal} value={value} onChange={onChange} />
)}

    </div>
  );
}


/* ===================== */
/* PG */
/* ===================== */

function SoalPG({
  soal,
  value,
  onChange
}: {
  soal: Soal;
  value: string;
  onChange: (v: string) => void;
}) {

  const pilihan = Array.isArray(soal.pilihan) ? soal.pilihan : [];

  return (
    <div className="space-y-3">

      {pilihan.map((p, i) => (

        <label
          key={i}
          className="flex items-start gap-3 border p-3 rounded-lg cursor-pointer active:scale-[0.98] transition"
        >

          <input
            type="radio"
            name={`soal_${soal.id}`}
            checked={value === p}
            onChange={() => onChange(p)}
          />

          <span className="font-semibold">
            {String.fromCharCode(65 + i)}.
          </span>

          {p}

        </label>

      ))}

    </div>
  );
}


/* ===================== */
/* PGK */
/* ===================== */

function SoalPGK({
  soal,
  value,
  onChange
}: {
  soal: Soal;
  value: string;
  onChange: (v: string) => void;
}) {

  const pilihan = Array.isArray(soal.pilihan) ? soal.pilihan : [];

  return (
    <div className="space-y-3">

      {pilihan.map((p, i) => (

        <label
          key={i}
          className="flex gap-3 border p-3 rounded cursor-pointer"
        >

          <input
  type="checkbox"
  checked={value.split("|").includes(p)}
  onChange={() => {

    const arr = value ? value.split("|") : [];

    if (arr.includes(p)) {
      onChange(arr.filter(v => v !== p).join("|"));
    } else {
      onChange([...arr, p].join("|"));
    }

  }}
/>

          {p}

        </label>

      ))}

    </div>
  );
}


/* ===================== */
/* BENAR SALAH */
/* ===================== */

function SoalBS({
  soal,
  value,
  onChange
}: {
  soal: Soal;
  value: string;
  onChange: (v: string) => void;
}) {

  let pilihan: string[] = [];

if (Array.isArray(soal.pilihan)) {
  pilihan = soal.pilihan.map((p:any) =>
    typeof p === "string" ? p : p.teks
  );
}
else if (typeof soal.pilihan === "object" && soal.pilihan !== null) {
  pilihan = Object.values(soal.pilihan) as string[];
}
else if (typeof soal.pilihan === "string") {
  try {
    const parsed = JSON.parse(soal.pilihan);

    if (Array.isArray(parsed)) {
      pilihan = parsed;
    } else if (typeof parsed === "object") {
      pilihan = Object.values(parsed) as string[];
    }

  } catch {
    pilihan = [];
  }
}

  return (
    <div className="space-y-4">

      {pilihan.map((p, i) => (

        <div
          key={i}
          className="border p-4 rounded"
        >

          <div className="mb-3">
            {p}
          </div>

          <label className="mr-6">

            <input
  type="radio"
  name={`bs_${soal.id}_${i}`}
  checked={value.split("|").includes(`benar_${i}`)}
  onChange={() => {

    const arr = value ? value.split("|") : [];
    const filtered = arr.filter(v => !v.endsWith(`_${i}`));

    onChange([...filtered, `benar_${i}`].join("|"));

  }}
/>

            <span className="ml-2">Benar</span>

          </label>

          <label>

            <input
  type="radio"
  name={`bs_${soal.id}_${i}`}
  checked={value.split("|").includes(`salah_${i}`)}
  onChange={() => {

    const arr = value ? value.split("|") : [];
    const filtered = arr.filter(v => !v.endsWith(`_${i}`));

    onChange([...filtered, `salah_${i}`].join("|"));

  }}
/>

            <span className="ml-2">Salah</span>

          </label>

        </div>

      ))}

    </div>
  );
}
