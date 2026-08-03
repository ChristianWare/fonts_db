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
              <h2 className={styles.heading}>Run your free audit here</h2>
            </div>
            <div className={styles.leftBottom}>
              <p className={styles.copy}>
                Drop in your URL and we&apos;ll score your site across six
                categories: speed, booking flow, SEO, trust, tech stack, and
                brand. Then we&apos;ll estimate the bookings you&apos;re losing
                every month.
              </p>
              <ul className={styles.metaList}>
                <li className={styles.metaItem}>$0 · No credit card</li>
                <li className={styles.metaItem}>Full report emailed to you</li>
                <li className={styles.metaItem}>Result in about 60 seconds</li>
              </ul>
              <figure className={styles.proof}>
                <blockquote className={styles.proofQuote}>
                  &ldquo;It paid for itself in the first month.&rdquo;
                </blockquote>
                <figcaption className={styles.proofAttribution}>
                  Barry LaNier, Owner, Nier Transportation
                </figcaption>
              </figure>
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
