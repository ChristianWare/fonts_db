"use client";

import styles from "./ParallaxArea.module.css";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Img1 from "../../../../public/images/range.jpg";
import ParallaxImageLarge from "../ParallaxImageLarge/ParallaxImageLarge";
import SectionIntro from "../../shared/SectionIntro/SectionIntro";

const data = [
  {
    id: 1,
    title:
      "You run a black car or limo company and take your service seriously",
  },
  {
    id: 2,
    title:
      "Your current booking process doesn't match the quality of your rides",
  },
  {
    id: 3,
    title:
      "You're done paying per-booking fees or sharing customers with a platform you don't own",
  },
  {
    id: 4,
    title:
      "You want corporate accounts, flight tracking, and a real admin dashboard — not workarounds",
  },
  {
    id: 5,
    title:
      "You're ready to own your brand, your data, and your customer relationships",
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
              Who this <br /> is for
            </h2>
            <div className={styles.bottom}>
              <div className={styles.left}>
                <p className={styles.copy}>
                  We build for one industry. If you run a black car or limo
                  company and your business deserves better than what generic
                  software gives you — this is built for you.
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
