"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/actions/auth/verify-email";
import styles from "./VerifyEmailPage.module.css";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : "No verification token found.",
  );

  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      const result = await verifyEmail(token);

      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/login"), 3000);
    };

    verify();
  }, [token, router]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brandName}>Fonts & Footers</span>

        {status === "loading" && (
          <div className={styles.state}>
            <div className={styles.spinner} />
            <h2 className={styles.heading}>Verifying your email...</h2>
            <p className={styles.text}>Just a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className={styles.state}>
            <div className={`${styles.icon} ${styles.iconSuccess}`}>✓</div>
            <h2 className={styles.heading}>Email verified</h2>
            <p className={styles.text}>
              Your account is active. Redirecting you to login...
            </p>
            <Link href='/login' className={styles.btn}>
              Go to login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className={styles.state}>
            <div className={`${styles.icon} ${styles.iconError}`}>✕</div>
            <h2 className={styles.heading}>Verification failed</h2>
            <p className={styles.text}>
              {errorMessage ?? "Something went wrong."}
            </p>
            <Link href='/login' className={styles.btn}>
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
