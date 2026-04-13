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
import XIcon from "@/components/shared/icons/XIcon/XIcon";

const data = [
  {
    id: 1,
    title: "You're invisible when it matters most",
    desc: "When someone searches for black car service in your city, your competitors show up. You don't. The operators getting those calls aren't better than you — they're just more visible.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 2,
    title: "Your website isn't closing anyone",
    desc: "Even when people find you, your site isn't built to convert them. No instant quote, slow load time, doesn't work on mobile. They move on before they book.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 3,
    title: "You don't own your client relationships",
    desc: "Your booking history, customer data, and client list live on someone else's platform. If they change their terms, raise fees, or shut down — you start over with nothing.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 3.1,
    title: "",
    desc: "",
    icon: "",
  },
  {
    id: 4,
    title: "No system for finding new accounts",
    desc: "There's no proactive process for reaching the hotels, venues, and corporate clients that should be sending you rides every month. Every new booking still feels like luck.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 5,
    title: "Every booking costs you twice",
    desc: "Once to run the ride, once to pay the platform. At $4–6 per booking you're writing a check to someone else every single day — with no ceiling on it.",
    icon: <XIcon className={styles.icon} />,
  },
  {
    id: 6,
    title: "Your operation runs on workarounds",
    desc: "Bookings in one app, drivers in another, payments somewhere else. Nothing talks to each other and things fall through during your busiest moments.",
    icon: <XIcon className={styles.icon} />,
  },
];
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
                  You&apos;re running a premium service, but you&apos;re still
                  chasing bookings one at a time. You&apos;re not showing up
                  when people search, your website isn&apos;t closing the ones
                  who find you, and there&apos;s no real system for finding the
                  corporate accounts that should be filling your calendar every
                  month.
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
            <h3 className={`${styles.headingii} h5`}>
              The six problems we see on almost every black car operator&apos;s
              business:
            </h3>

            <div className={styles.bottom}>
              {data.map((item) => (
                <div className={styles.card} key={item.id}>
                  <h3 className={styles.title}>
                    {item.icon && (
                      <span className={styles.iconContainer}>{item.icon}</span>
                    )}{" "}
                    {item.title}
                  </h3>
                  <p className={styles.desc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
