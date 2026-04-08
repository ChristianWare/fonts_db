"use client";

import styles from "./Outgrow.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Image from "next/image";
import Img1 from "../../../../public/images/stressed.jpg";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

// import Arrow from "@/components/shared/icons/Arrow/Arrow";
// import Money from "@/components/shared/icons/Money/Money";
// import FeesIcon from "@/components/shared/icons/FeesIcon/FeesIcon";
// import NotBrand from "@/components/shared/icons/NotBrand/NotBrand";
// import NoData from "@/components/shared/icons/NoData/NoData";
// import ScatteredIcon from "@/components/shared/icons/ScatteredIcon/ScatteredIcon";
// import NoControl from "@/components/shared/icons/NoControl/NoControl";
// import NoControlii from "@/components/shared/icons/NoControlii/NoControlii";

// const data = [
//   {
//     id: 1,
//     title: "Every booking costs you twice",
//     desc: "Once to run the ride, once to pay the platform. At $4–6 a booking, you're writing a check to someone else every single day — and there's no ceiling on it.",
//     icon: <FeesIcon className={styles.icon} />,
//   },
//   {
//     id: 2,
//     title: "Your clients can't tell you apart",
//     desc: "The booking experience is identical to every other operator on the same software. You've built something better. It doesn't show.",
//     icon: <NotBrand className={styles.icon} />,
//   },
//   {
//     id: 3,
//     title: "You don't own the relationship",
//     desc: "The platform owns your customer data. If they change their terms, raise fees, or shut down — you're starting over with nothing.",
//     icon: <NoData className={styles.icon} />,
//   },
//   {
//     id: 3.1,
//     title: "",
//     desc: "",
//     icon: "",
//   },
//   {
//     id: 4,
//     title: "Nothing changes unless they say so",
//     desc: "Pricing rules, policies, algorithms — all on their schedule. You're building a business on a foundation someone else controls.",
//     icon: <NoControlii className={styles.icon} />,
//   },
//   {
//     id: 5,
//     title: "You're losing deals before hello",
//     desc: "Executives and corporate clients judge you the moment they land on your site. A generic booking page signals a generic service.",
//     icon: <NoControl className={styles.icon} />,
//   },
//   {
//     id: 6,
//     title: "Your operation runs on workarounds",
//     desc: "Bookings in one app, drivers in another, payments somewhere else. Things fall through because the tools were never meant to work together.",
//     icon: <ScatteredIcon className={styles.icon} />,
//   },
// ];

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
    "You built a premium car service. Your booking experience should not look like everyone else's.";

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
                {/* <h2 className={`${styles.heading} h1`}>
                  You built a premium service. Your booking experience
                  shouldn&apos;t look like everyone else&apos;s.
                </h2> */}
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
                <p className={styles.copy}>
                  You&apos;re running a premium operation — but your clients are
                  booking through the same generic interface as every budget
                  sedan in town. That disconnect costs you corporate contracts,
                  repeat business, and a cut of every ride. And the platform
                  you&apos;re on isn&apos;t built to fix it.
                </p>
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
            {/* <div className={styles.bottom}>
              {data.map((item) => (
                <div className={styles.card} key={item.id}>
                    {item.icon && (
                      <span className={styles.iconContainer}>{item.icon}</span>
                    )}
                  <h3 className={styles.title}>
                    {item.title}
                  </h3>
                  <p className={styles.desc}>{item.desc}</p>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
