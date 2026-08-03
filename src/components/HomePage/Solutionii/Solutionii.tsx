"use client";

import { useEffect, useRef, SVGProps, ComponentType } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Solutionii.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";
import Image from "next/image";
import Img1 from "../../../../public/images/subNoBG.png";
import LeadsIcon from "@/components/shared/icons/LeadsIcon/LeadsIcon";
import AuditIcon from "@/components/shared/icons/AuditIcon/AuditIcon";
import MouseIcon from "@/components/shared/icons/MouseIcon/MouseIcon";

type Card = {
  id: number;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  heading: string;
  body: string;
  href: string;
};

const cards: Card[] = [
  {
    id: 7,
    Icon: AuditIcon,
    heading: "Free Website Audit",
    body: "Enter your URL and get a full breakdown of what's costing you bookings: your Google visibility, site speed, mobile performance, and conversion gaps. Your score shows on screen in 60 seconds, and the full report goes to your inbox if you want it.",
    href: "/audit",
  },
  {
    id: 8,
    Icon: LeadsIcon,
    heading: "Lead Generation Tool",
    body: "Find the businesses in your market that generate consistent transportation demand. Every lead comes with a specific contact, verified email or phone, and an AI-written outreach script personalized to that business.",
    href: "/leads",
  },
  {
    id: 9,
    Icon: MouseIcon,
    heading: "Custom Booking Website",
    body: "A custom website built specifically for black car operators, starting at $199 a month. Step up to the Full Platform when you're ready for direct booking: flight tracking, driver portal, and payments included, zero per-booking fees, one flat rate.",
    href: "/websites",
  },
];

export default function Solutionii() {
  const sectionRef = useRef<HTMLElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Disable parallax on mobile
      if (window.innerWidth <= 1268) {
        if (card1Ref.current) card1Ref.current.style.transform = "";
        if (card3Ref.current) card3Ref.current.style.transform = "";
        return;
      }

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      // scrolledIntoView: 0 when section top hits bottom of viewport, grows as you scroll
      const scrolledIntoView = window.innerHeight - rect.top;

      const factor = 0.12;

      if (card1Ref.current) {
        // Card 1 drifts downward
        card1Ref.current.style.transform = `translateY(${scrolledIntoView * factor}px)`;
      }

      if (card3Ref.current) {
        // Card 3 drifts upward (opposite of card 1)
        card3Ref.current.style.transform = `translateY(${-scrolledIntoView * factor}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount so initial position is set
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className={styles.container} ref={sectionRef}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <div className={styles.imgContainer}>
                  <Image
                    src={Img1}
                    alt=''
                    title=''
                    fill
                    className={styles.img}
                  />
                </div>
              </div>
              <div className={styles.topRight}>
                <SectionIntro text='SOLUTION' />
                <h2 className={styles.heading}>
                  We can help you{" "} <br />
                  <span className={styles.accent}>get more bookings</span>
                </h2>
                <h3 className={`${styles.subheading} h6`}>
                  Three solutions. One system. Built to grow your black car
                  business.
                </h3>
                <p className={styles.copy}>
                  We didn&apos;t build a generic tool and point it at the
                  transportation industry. Every product was built from the
                  ground up for black car operators specifically: the way you
                  work, the clients you chase, and the problems you actually
                  face. Each one works on its own, but they&apos;re designed to
                  work together.
                </p>
              </div>
            </div>
            <div className={styles.bottom}>
              <div className={styles.mapDataContainer}>
                {cards.map((x, index) => {
                  const { Icon } = x;
                  return (
                    <div
                      className={styles.card}
                      key={x.id}
                      ref={
                        index === 0 ? card1Ref : index === 2 ? card3Ref : null
                      }
                    >
                      <div className={styles.cardTop}>
                        <h3>{x.heading}</h3>
                      </div>
                        <Icon className={styles.cardIcon} aria-hidden='true' />
                      <div className={styles.cardBottom}>
                        <p className={styles.body}>{x.body}</p>
                        <div className={styles.btnContainer}>
                          <Button
                            href={x.href}
                            text='Learn more'
                            btnType='accent'
                            arrow
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
