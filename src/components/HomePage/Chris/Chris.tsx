import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import styles from "./Chris.module.css";
import Image from "next/image";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import ChrisImg from "../../../../public/images/chris.png";

export default function Chris() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.circleContainer}>
              <div className={styles.pulsingCircles} />
              <div className={styles.imgContainer}>
                <Image
                  src={ChrisImg}
                  alt='Chris Ware'
                  fill
                  className={styles.img}
                />
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <SectionIntro text='Chris Ware — Founder' color='black' />
            <h2 className={styles.heading}>
              A quick hello <br />
              from the builder
            </h2>
            <p className={styles.copy}>
              I&apos;m Chris, the developer behind Fonts &amp; Footers. I built
              this platform because generic software wasn&apos;t cutting it —
              black car operators running premium services out of spreadsheets
              and booking apps that weren&apos;t built for how they actually
              work. So I built it from the ground up, deployed it with a real
              operator in Phoenix, and refined it until it worked the way the
              business needed it to. When you come onboard, you&apos;re getting
              a platform that&apos;s already handling real bookings, real
              drivers, and real corporate clients — not a prototype, and not
              built for someone else&apos;s operation.
            </p>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
