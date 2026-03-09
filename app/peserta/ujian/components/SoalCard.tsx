"use client";

type Soal = {
  id: number;
  pertanyaan: string;
  tipe: "pg" | "pgk" | "bs";
  pilihan: any[];
};

type Props = {
  soal: Soal;
};

export default function SoalCard({ soal }: Props) {

  return (
    <div>

      <div className="mb-6 text-lg">
        {soal.pertanyaan}
      </div>

      {soal.tipe === "pg" && <SoalPG soal={soal} />}
      {soal.tipe === "pgk" && <SoalPGK soal={soal} />}
      {soal.tipe === "bs" && <SoalBS soal={soal} />}

    </div>
  );
}


/* ===================== */
/* PG */
/* ===================== */

function SoalPG({ soal }: { soal: Soal }) {

  return (
    <div className="space-y-3">

      {soal.pilihan?.map((p: any, i: number) => (

        <label
          key={i}
          className="flex gap-3 border p-3 rounded cursor-pointer"
        >

          <input
            type="radio"
            name={`soal_${soal.id}`}
          />

          {p}

        </label>

      ))}

    </div>
  );
}


/* ===================== */
/* PGK */
/* ===================== */

function SoalPGK({ soal }: { soal: Soal }) {

  return (
    <div className="space-y-3">

      {soal.pilihan?.map((p: any, i: number) => (

        <label
          key={i}
          className="flex gap-3 border p-3 rounded cursor-pointer"
        >

          <input type="checkbox" />

          {p}

        </label>

      ))}

    </div>
  );
}


/* ===================== */
/* BENAR SALAH */
/* ===================== */

function SoalBS({ soal }: { soal: Soal }) {

  return (
    <div className="space-y-4">

      {soal.pilihan?.map((p: any, i: number) => (

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
            />

            <span className="ml-2">Benar</span>

          </label>

          <label>

            <input
              type="radio"
              name={`bs_${soal.id}_${i}`}
            />

            <span className="ml-2">Salah</span>

          </label>

        </div>

      ))}

    </div>
  );
}