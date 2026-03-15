import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Fonts & Footers</span>
        </div>
        <div className={styles.code}>
          <span className={styles.codeNumber}>404</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Page not found</p>
          <h1 className={styles.heading}>
            This page
            <br />
            doesn&apos;t
            <br />
            <span>exist.</span>
          </h1>
          <p className={styles.body}>
            The page you&apos;re looking for has been moved, deleted, or never
            existed. Head back to safety.
          </p>
          <div className={styles.actions}>
            <Link href='/' className={styles.primaryBtn}>
              Go to Home Page →
            </Link>
            <Link href='/login' className={styles.secondaryBtn}>
              Go to Login Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
