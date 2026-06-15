"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditHero.module.css";
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
    <section className={styles.container} id='audit'>
      <LayoutWrapper borderDark>
        <div className={styles.content}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />

          {/* ── Left: context ── */}
          <div className={styles.left}>
            <div className={styles.leftTop}>
              <SectionIntro
                text='Free Website Audit'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                Find out what&apos;s <br /> costing you bookings
              </h2>
            </div>
            <div className={styles.leftBottom}>
              <p className={styles.copy}>
                Drop in your URL and we&apos;ll score your site across six
                categories — speed, booking flow, SEO, trust, tech stack, and
                brand — then estimate the bookings you&apos;re losing every
                month.
              </p>
              <ul className={styles.metaList}>
                <li className={styles.metaItem}>$0 · No card required</li>
                <li className={styles.metaItem}>
                  Full PDF report emailed to you
                </li>
                <li className={styles.metaItem}>Result in ~60 seconds</li>
              </ul>
            </div>
          </div>

          {/* ── Right: the tool ── */}
          <div className={styles.right}>
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
      </LayoutWrapper>
    </section>
  );
}
