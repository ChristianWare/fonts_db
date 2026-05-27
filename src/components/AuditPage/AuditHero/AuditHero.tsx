"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AuditHero.module.css";
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
            <div className={styles.bottom}>
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
