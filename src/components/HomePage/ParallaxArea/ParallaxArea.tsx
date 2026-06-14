"use client";

import styles from "./ParallaxArea.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Img1 from "../../../../public/images/range.jpg";
import ParallaxImageLarge from "../ParallaxImageLarge/ParallaxImageLarge";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

const data = [
  {
    id: 1,
    title: "You run a black car or limo operation and you take it seriously",
  },
  {
    id: 2,
    title:
      "You want to know exactly where your current website is costing you bookings",
  },
  {
    id: 3,
    title:
      "You need a steady pipeline of corporate, event, and gala work in your market",
  },
  {
    id: 4,
    title:
      "You're tired of paying a platform every time a client books with you",
  },
  {
    id: 5,
    title:
      "You're ready to own your customers, your data, and your brand outright",
  },
];

export default function ParallaxArea() {
  return (
    <section className={styles.container}>
      <ParallaxImageLarge src={Img1} alt='Parallax background' />
      <div className={styles.imgOverlay} />
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.contentChildren}>
            <h2 className={styles.heading}>
              Built for <br /> one operator.
            </h2>
            <div className={styles.bottom}>
              <div className={styles.left}>
                <p className={styles.copy}>
                  We don&apos;t build for everyone. We work with black car and
                  limo operators who&apos;ve outgrown generic software — giving
                  you three ways to grow: a free audit to see where you stand, a
                  leads tool that finds the work in your market, and a custom
                  booking platform that lets you own your brand, your clients,
                  and every dollar you earn.
                </p>
              </div>
              <div className={styles.right}>
                {/* <div className={styles.imgContainer}>
                  <Image src={Img2} alt='' fill className={styles.img} />
                </div> */}
                <div className={styles.sectionIntroContainer}>
                  <SectionIntro text="We're a good fit if..." />
                </div>
                <ul className={styles.dataBox}>
                  {data.map((x) => (
                    <li key={x.id} className={styles.title}>
                      <span className={styles.index}>{x.id}</span> {x.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
