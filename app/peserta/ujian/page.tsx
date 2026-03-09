import { Suspense } from "react";
import UjianClient from "./UjianClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <UjianClient />
    </Suspense>
  );
}