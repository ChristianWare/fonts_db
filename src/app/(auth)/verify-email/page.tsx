import { Suspense } from "react";
import VerifyEmailPage from "./VerifyEmailPage";

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
