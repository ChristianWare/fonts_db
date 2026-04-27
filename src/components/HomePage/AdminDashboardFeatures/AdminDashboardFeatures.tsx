"use client";

import styles from "./AdminDashboardFeatures.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Arrow from "../../shared/icons/Arrow/Arrow";
// import Image from "next/image";
import { useEffect, useState } from "react";
import { FocusFeatures } from "@/lib/data";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

export default function AdminFocusFeatures() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);
  const total = FocusFeatures.length;

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsNarrow(window.innerWidth <= 768);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const orderedFeatures = FocusFeatures.map((_, idx) => {
    const featureIndex = (currentIndex + idx) % total;
    return FocusFeatures[featureIndex];
  });

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <SectionIntro
                text='The focus'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                Why we only build <br /> for black car operators
              </h2>
              <p className={styles.copy}>
                Black car operators run a specific kind of business with
                specific kinds of problems. Generic platforms can&apos;t solve
                them because they were never designed to. We chose depth over
                reach — and that focus shows up in every product we ship.
              </p>
              <div className={styles.arrowsContainer}>
                <button
                  type='button'
                  className={styles.arrowButton}
                  onClick={handlePrev}
                  aria-label='Previous reason'
                >
                  <Arrow className={styles.arrowLeft} />
                </button>
                <button
                  type='button'
                  className={styles.arrowButton}
                  onClick={handleNext}
                  aria-label='Next reason'
                >
                  <Arrow className={styles.arrowRight} />
                </button>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.bottomLeft}>
                <div className={styles.featureList}>
                  {FocusFeatures.map((feature, idx) => (
                    <button
                      key={feature.id}
                      type='button'
                      className={`${styles.featureTab} ${
                        currentIndex === idx ? styles.featureTabActive : ""
                      }`}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {feature.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.bottomRight}>
                {orderedFeatures.map((feature, index) => {
                  const visibleIndex = Math.min(index, 3);
                  const scaleStep = isNarrow ? 0.08 : 0.12;
                  const offsetStep = isNarrow ? 30 : 80;
                  const scale = 1 - visibleIndex * scaleStep;
                  const offsetX = visibleIndex * offsetStep;
                  const opacity = index > 3 ? 0 : 1;
                  const zIndex = total - index;
                  const isActive = index === 0;

                  return (
                    <div
                      key={feature.id}
                      className={styles.projectCard}
                      style={{
                        transform: `translateX(-${offsetX}px) scale(${scale})`,
                        opacity,
                        zIndex,
                        pointerEvents: isActive ? "auto" : "none",
                      }}
                    >
                      <div className={styles.imageWrapper}>
                        {/* <Image
                          src={feature.src}
                          alt={feature.title}
                          fill
                          className={styles.projectImage}
                          priority={index === 0}
                        /> */}
                        <div className={styles.imageOverlay} />
                      </div>
                      <div className={styles.projectInfo}>
                        <div className={styles.projectText}>
                          <h3 className={`${styles.projectTitle} h2ii`}>
                            {feature.title}
                          </h3>
                          <p className={styles.projectH1}>{feature.desc}</p>
                        </div>
                        <div className={styles.projectCta}>
                          <span className={styles.featureCount}>
                            {String(currentIndex + 1).padStart(2, "0")} /{" "}
                            {String(total).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className={styles.bottomMsg}>
            <h2 className={styles.bottomMsgHeading}>
              Built for black car. <br /> Only black car.
            </h2>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
