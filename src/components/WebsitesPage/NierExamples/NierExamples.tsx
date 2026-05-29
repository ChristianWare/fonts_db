"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./NierExamples.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image, { type StaticImageData } from "next/image";
import Button from "@/components/shared/Button/Button";
import Modal from "@/components/shared/Modal/Modal";
import NierHomePage from "../../../../public/images/nierHomePage.png";
import NierAboutPage from "../../../../public/images/nierAboutPage.png";
import NierServicesPage from "../../../../public/images/nierServicesPage.png";
import NierServicesDetailsPage from "../../../../public/images/nierServicesDetailsPage.png";
import NierBookingPage from "../../../../public/images/nierBookingPage.png";
import NierConfirmationPage from "../../../../public/images/nierConfirmationPage.png";
import NierAdminDetailsPage from "../../../../public/images/nierAdminDetails.png";

type NierExample = {
  title: string;
  src: StaticImageData;
};

const nierExamples: NierExample[] = [
  {
    title: "Home page",
    src: NierHomePage,
  },
  {
    title: "About page",
    src: NierAboutPage,
  },
  {
    title: "Services page",
    src: NierServicesPage,
  },
  {
    title: "Services Details page",
    src: NierServicesDetailsPage,
  },
  {
    title: "Booking page",
    src: NierBookingPage,
  },
  {
    title: "Confirmation page",
    src: NierConfirmationPage,
  },
  {
    title: "Admin Details page",
    src: NierAdminDetailsPage,
  },
];

export default function NierExamples() {
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
                <SectionIntro text='Inside the build' />
                <h2 className={styles.heading}>
                  Page by page, <br />
                  <span className={styles.accent}>built from scratch.</span>
                </h2>
                <h3 className={`${styles.subheading} h6`}>
                  Real screenshots from Nier Transportation&apos;s live website.
                  Click any page to see the full version.
                </h3>
                <p className={styles.copy}>
                  Every page below is from Nier&apos;s actual live website —
                  designed, built, and deployed by us. No templates, no themes,
                  no booking widgets bolted onto someone else&apos;s design.
                  Every page was custom-built around the way Nier operates, and
                  the same level of detail goes into anything we build for you.
                </p>
              </div>
            </div>

            <div className={styles.bottom}>
              {nierExamples.map((item, i) => (
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
              <div className={styles.btnContainer}>
                <Button
                  href='https://www.niertransportation.com/'
                  target='_blank'
                  text='Live Site'
                  btnType='black'
                  arrow
                />
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>

      <Modal isOpen={openIndex !== null} onClose={closeModal}>
        {openIndex !== null && (
          <div className={styles.modalImageWrap}>
            <Image
              src={nierExamples[openIndex].src}
              alt={`${nierExamples[openIndex].title} — full preview`}
              title={`${nierExamples[openIndex].title} — full preview`}
              className={styles.modalImage}
              priority
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
