"use client";

import styles from "./Outgrow.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Image from "next/image";
import Img1 from "../../../../public/images/stressed.jpg";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

import ProblemSolution from "../ProblemSolution/ProblemSolution";

export default function Outgrow() {
  const [lettersRef, setLettersRef] = useArrayRef();
  const triggerRef = useRef(null);

  function useArrayRef(): [
    React.MutableRefObject<HTMLSpanElement[]>,
    (ref: HTMLSpanElement) => void,
  ] {
    const lettersRef = useRef<HTMLSpanElement[]>([]);
    lettersRef.current = [];
    return [lettersRef, (ref) => ref && lettersRef.current.push(ref)];
  }

  gsap.registerPlugin(ScrollTrigger);

  const text =
    "Most black car operators are losing business every week and don't know exactly why.";

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        scrub: 0.9,
        start: "top center",
        end: "+=2500",
        markers: false,
      },
    });

    lettersRef.current.forEach((letter, index) => {
      tl.to(
        letter,
        {
          color: "var(--black)",
          textShadow: "none",
          duration: 0.2,
        },
        index * 0.015,
      );
    });

    return () => {
      tl.scrollTrigger?.kill();
    };
  }, [lettersRef]);

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <SectionIntro text='Problem' />

                <h2 className={styles.heading}>
                  {text.split("").map((letter, index) => (
                    <span
                      key={index}
                      className={styles.revealText}
                      ref={setLettersRef}
                    >
                      {letter}
                    </span>
                  ))}
                </h2>
              </div>
              <div className={styles.topRight}>
                <div className={styles.imgContainer}>
                  <Image
                    src={Img1}
                    alt='Stressed out driver'
                    title='Stressed out driver'
                    fill
                    className={styles.img}
                  />
                </div>
              </div>
            </div>
            <ProblemSolution />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
