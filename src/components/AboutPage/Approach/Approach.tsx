'use client';

import LayoutWrapper from '@/components/shared/LayoutWrapper'
import styles from './Approach.module.css'
import { useEffect, useRef, useState } from "react";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import { approachData } from "@/lib/data";

export default function Approach() {
     const [activeIndex, setActiveIndex] = useState(0);
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
        handleScroll();
    
        return () => window.removeEventListener("scroll", handleScroll);
      }, []);
    
      const activeFeature = approachData[activeIndex];
      const ActiveIcon = activeFeature.icon;
    
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <SectionIntro text='Features' />
              <h2 className={styles.heading}>
                Everything <br /> your operation
                <br /> needs to run
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
                      <div className={styles.imageWrapper}>
                        <ActiveIcon className={styles.featureIcon} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.bottomRight}>
                    {approachData.map((x, index) => {
                      const CardIcon = x.icon;
                      return (
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
                          <h3 className={`${styles.cardTitle} h2ii`}>
                            {x.title}
                          </h3>
                          <div className={styles.mobileImageWrapper}>
                            <CardIcon className={styles.featureIcon} />
                          </div>
                          <p className={styles.desc}>{x.desc}</p>
                        </div>
                      );
                    })}
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
