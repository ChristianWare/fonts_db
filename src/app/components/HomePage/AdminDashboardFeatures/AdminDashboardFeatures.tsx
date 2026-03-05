"use client";

import styles from "./AdminDashboardFeatures.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Arrow from "../../shared/icons/Arrow/Arrow";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DashboardFeatures } from "@/lib/data";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

export default function AdminDashboardFeatures() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);
  const total = DashboardFeatures.length;

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

  const orderedFeatures = DashboardFeatures.map((_, idx) => {
    const featureIndex = (currentIndex + idx) % total;
    return DashboardFeatures[featureIndex];
  });

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <SectionIntro
                text='Your command center'
                color='colorWhite'
                background='bgBlack'
              />
              <h2 className={styles.heading}>
                Run your entire operation <br /> from one dashboard
              </h2>
              <p className={styles.copy}>
                The admin dashboard gives you — and any team members you
                authorize — full visibility and control over every booking,
                every driver, every payment, and every customer on your
                platform. No more juggling spreadsheets, email threads, and
                separate apps.
              </p>
              <div className={styles.arrowsContainer}>
                <button
                  type='button'
                  className={styles.arrowButton}
                  onClick={handlePrev}
                  aria-label='Previous feature'
                >
                  <Arrow className={styles.arrowLeft} />
                </button>
                <button
                  type='button'
                  className={styles.arrowButton}
                  onClick={handleNext}
                  aria-label='Next feature'
                >
                  <Arrow className={styles.arrowRight} />
                </button>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.bottomLeft}>
                <div className={styles.featureList}>
                  {DashboardFeatures.map((feature, idx) => (
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
                        <Image
                          src={feature.src}
                          alt={feature.title}
                          fill
                          className={styles.projectImage}
                          priority={index === 0}
                        />
                        <div className={styles.imageOverlay} />
                      </div>
                      <div className={styles.projectInfo}>
                        <div className={styles.projectText}>
                          <h3 className={styles.projectTitle}>
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
              <span>The admin dashboard </span>
              gives you full visibility and control over{" "}
              <span>
                every booking, every driver, every payment, and every
                customer{" "}
              </span>
              {" "}on your platform.
            </h2>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
