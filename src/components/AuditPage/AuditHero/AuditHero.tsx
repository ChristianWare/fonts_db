"use client";


import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import AuditModalContent from "@/components/AuditPage/AuditModalContent/AuditModalContent";
import { AuditResult, ModalState } from "@/app/audit/page";

interface Props {
  state: ModalState;
  scanStep: number;
  scanComplete: boolean;
  result: AuditResult | null;
  error: string;
  onSubmit: (url: string, email: string, firstName: string) => void;
  onReset: () => void;
}

export default function AuditHero({
  state,
  scanStep,
  scanComplete,
  result,
  error,
  onSubmit,
  onReset,
}: Props) {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.top}>
              <Nav />
            </div>
            <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='Product 01 of 03' />
                <h1 className={`${styles.heading} h2ii`}>
                  Find out exactly what&apos;s costing you bookings —
                  <br /> <span className={styles.accent}>in 60 seconds. </span>
                </h1>
                <p className={styles.copy}>
                  The Fonts & Footers audit tool analyzes your website across
                  the factors that determine whether you get found, whether
                  visitors trust you, and whether your site actually converts.
                  Free, instant results, with the full report sent straight to
                  your inbox.
                </p>
              </div>
              <div className={styles.auditWrapper}>
                <AuditModalContent
                  state={state}
                  scanStep={scanStep}
                  scanComplete={scanComplete}
                  result={result}
                  error={error}
                  onSubmit={onSubmit}
                  onReset={onReset}
                  onClose={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
