"use client";

import { useState } from "react";
import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./LeadsPreview.module.css";
import Image from "next/image";
import DashboardPreview from "../../../../public/images/leadsPreview.png";
import Button from "../../shared/Button/Button";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Modal from "@/components/shared/Modal/Modal";

export default function LeadsPreview() {
  const [modalOpen, setModalOpen] = useState(false);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.left}>
              <div className={styles.leftTop}>
                <SectionIntro
                  text='Inside the tool'
                  background='bgBlack'
                  color='colorWhite'
                />
                <h2 className={`${styles.heading} h3`}>
                  See what the leads tool actually looks like
                </h2>
                <div className={styles.imgContainerii}>
                  <Image
                    src={DashboardPreview}
                    alt='Leads dashboard preview'
                    title='Leads dashboard preview'
                    fill
                    className={styles.imgRight}
                  />
                  <div className={styles.expandBtnWrap}>
                    <Button
                      text='Click to expand'
                      btnType='white'
                      arrow
                      onClick={openModal}
                    />
                  </div>
                </div>
                <p>
                  The black car operators booking the most corporate work
                  aren&apos;t waiting for referrals. They&apos;re working a
                  pipeline of prospects every week — venues, hotels, law firms,
                  casinos, and event coordinators they&apos;ve identified,
                  scored, and personally pitched. The reality is that most
                  operators don&apos;t have the time or research bandwidth to
                  build that pipeline from scratch.
                  <br />
                  <br />
                  <span className={styles.accent}>
                    That&apos;s what our leads tool delivers. Every morning we
                    surface the highest-scoring prospects in your market across
                    nine categories — enriched with verified contacts, paired
                    with personalized outreach scripts, and complete with a
                    strategic brief on how to approach each one. One email.
                    Everything you need to act. No spreadsheets, no LinkedIn
                    detective work, no guessing.
                  </span>
                </p>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLeft}>
                  <span className={styles.detail}>Lead categories tracked</span>
                  <span className={`${styles.heading} h2ii`}>+9</span>
                </div>
                <div className={styles.statRight}>
                  <span className={styles.detail}>Weekly research saved</span>
                  <span className={`${styles.heading} h2ii`}>−40h</span>
                </div>
                <div className={styles.btnContainer}>
                  <Button
                    href='/contact'
                    text='Book a demo'
                    btnType='gray'
                    arrow
                  />
                </div>
              </div>
            </div>
            <div className={styles.right}>
              <div className={styles.imgContainer}>
                <Image
                  src={DashboardPreview}
                  alt='Leads dashboard preview'
                  title='Leads dashboard preview'
                  fill
                  className={styles.imgRight}
                />
                <div className={styles.expandBtnWrap}>
                  <Button
                    text='Click to expand'
                    btnType='white'
                    arrow
                    onClick={openModal}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        <div className={styles.modalImageWrap}>
          <Image
            src={DashboardPreview}
            alt='Leads dashboard — full preview'
            title='Leads dashboard — full preview'
            className={styles.modalImage}
            priority
          />
        </div>
      </Modal>
    </section>
  );
}
