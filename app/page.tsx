import { Suspense } from "react";
import EduStreamApp from "./EduStreamApp";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0a" }} />}>
      <EduStreamApp />
    </Suspense>
  );
}
