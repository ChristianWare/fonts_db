"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Features.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import { featureData } from "@/lib/data";
import Image from "next/image";
import Modal from "@/components/shared/Modal/Modal";

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<
    (typeof featureData)[number]["src"] | null
  >(null);
  const [modalTitle, setModalTitle] = useState("");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      cardRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // set correct index on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeFeature = featureData[activeIndex];

  function openModal(src: (typeof featureData)[number]["src"], title: string) {
    setModalSrc(src);
    setModalTitle(title);
    setModalOpen(true);
  }

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <SectionIntro text='Features' />
              <h2 className={styles.heading}>
                Features <br /> Of our direct
                <br /> booking websites
              </h2>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                <div className={styles.dataParent}>
                  <div className={styles.bottomLeft}>
                    <div className={styles.dot1} />
                    <div className={styles.dot2} />
                    <div className={styles.stickyPanel} key={activeIndex}>
                      <span className={styles.index}>
                        {String(activeIndex + 1).padStart(2, "0")}
                      </span>
                      {activeFeature.src && (
                        <div className={styles.imageWrapper}>
                          <Image
                            src={activeFeature.src}
                            alt={activeFeature.title}
                            fill
                            className={styles.featureImage}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.bottomRight}>
                    {featureData.map((x, index) => (
                      <div
                        className={`${styles.card} ${
                          index === activeIndex
                            ? styles.cardActive
                            : styles.cardInactive
                        }`}
                        key={x.title}
                        data-index={String(index + 1).padStart(2, "0")}
                        ref={(el) => {
                          cardRefs.current[index] = el;
                        }}
                      >
                        <div className={styles.dot1} />
                        <div className={styles.dot2} />
                        <h3 className={`${styles.cardTitle} h2`}>{x.title}</h3>
                        {x.src && (
                          <div className={styles.mobileImageWrapper}>
                            <Image
                              src={x.src}
                              alt={x.title}
                              fill
                              className={styles.featureImage}
                            />
                            <div className={styles.mobileImageOverlay}>
                              <button
                                className={styles.expandBtn}
                                onClick={() => openModal(x.src, x.title)}
                                aria-label={`Expand ${x.title} image`}
                              >
                                Expand
                              </button>
                            </div>
                          </div>
                        )}
                        <p className={styles.desc}>{x.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {modalSrc && (
          <div className={styles.modalImageWrapper}>
            <Image
              src={modalSrc}
              alt={modalTitle}
              fill
              className={styles.modalImage}
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
