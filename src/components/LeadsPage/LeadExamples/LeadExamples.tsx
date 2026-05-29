"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./LeadExamples.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image, { type StaticImageData } from "next/image";
import Button from "@/components/shared/Button/Button";
import Modal from "@/components/shared/Modal/Modal";
import LeadsDashboardScreen from "../../../../public/images/leadColdLeads.png";
import LeadWarmLeads from "../../../../public/images/leadWarmLeads.png";
import LeadHotLeads from "../../../../public/images/leadHotLeads.png";
import ColdLeadsDetails from "../../../../public/images/coldLeadsDetails.png";
import SavedLeadsDetails from "../../../../public/images/savedLeadsDetails.png";
import LeadsEmail from "../../../../public/images/leadsEmail.png";

type LeadExample = {
  title: string;
  src: StaticImageData;
};

const leadExamples: LeadExample[] = [
  { title: "Cold Leads", src: LeadsDashboardScreen },
  { title: "Warm Leads", src: LeadWarmLeads },
  { title: "Hot Leads", src: LeadHotLeads },
  { title: "Leads Details Page", src: ColdLeadsDetails },
  { title: "Saved Leads Page", src: SavedLeadsDetails },
  { title: "Leads Email", src: LeadsEmail },
];

export default function LeadExamples() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function openModal(i: number) {
    setOpenIndex(i);
  }

  function closeModal() {
    setOpenIndex(null);
  }

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <div className={styles.imagContainer}>
                  {/* <LightBulbii className={styles.icon} /> */}
                </div>
              </div>
              <div className={styles.topRight}>
                <SectionIntro text='The full tour' />
                <h2 className={styles.heading}>
                  Every screen, <br />
                  <span className={styles.accent}>from search to close.</span>
                </h2>
                <h3 className={`${styles.subheading} h6`}>
                  Real screenshots from the leads tool. Click any screen to see
                  the full version.
                </h3>
                <p className={styles.copy}>
                  Every screen below is from the actual leads tool — the
                  dashboard you&apos;ll see every morning. No generic CRM
                  templates, no salesperson dashboards retrofitted from other
                  industries. Every screen was built around how black car
                  operators actually work a pipeline, and the workflow keeps
                  getting tighter with every release.
                </p>
              </div>
            </div>

            <div className={styles.bottom}>
              {leadExamples.map((item, i) => (
                <div className={styles.exampleCard} key={item.title}>
                  <span className={styles.exampleTitle}>{item.title}</span>
                  <div className={styles.imgContainer}>
                    <Image
                      src={item.src}
                      alt={item.title}
                      title={item.title}
                      fill
                      className={styles.imgRight}
                    />
                    <div className={styles.expandBtnWrap}>
                      <Button
                        text='Click to expand'
                        btnType='accent'
                        arrow
                        onClick={() => openModal(i)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>

      <Modal isOpen={openIndex !== null} onClose={closeModal}>
        {openIndex !== null && (
          <div className={styles.modalImageWrap}>
            <Image
              src={leadExamples[openIndex].src}
              alt={`${leadExamples[openIndex].title} — full preview`}
              title={`${leadExamples[openIndex].title} — full preview`}
              className={styles.modalImage}
              priority
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
