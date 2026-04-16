"use client";

import { Suspense } from "react";
import EduStreamApp from "./EduStreamApp";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EduStreamApp />
    </Suspense>
  );
}
