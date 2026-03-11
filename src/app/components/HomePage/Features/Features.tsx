"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Features.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import { featureData } from "@/lib/data";

export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    cardRefs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        {
          rootMargin: "-40% 0px -40% 0px",
          threshold: 0,
        },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <SectionIntro text='Features' />
              <h2 className={styles.heading}>
                A booking <br /> experience your
                <br /> riders will love
              </h2>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {/* Desktop layout — index pinned left, cards scroll right */}
                <div className={styles.dataParent}>
                  <div className={styles.bottomLeft}>
                    <div className={styles.dot1} />
                    <div className={styles.dot2} />
                    <span className={styles.index} key={activeIndex}>
                      {String(activeIndex + 1).padStart(2, "0")}
                    </span>
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
    </section>
  );
}
