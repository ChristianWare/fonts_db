import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ChrisAboutPage.module.css";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image from "next/image";
import ChrisImg from "../../../../public/images/chris.png";

export default function ChrisAboutPage() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro text='Chris Ware' />
            <h2 className={styles.heading}>
              A quick hello — <br />
              <span className={styles.accent}>from the builder</span>
            </h2>
            <div className={styles.copyContainer}>
              <p className={styles.copy}>
                I&apos;m Chris, the developer behind Fonts & Footers. I built
                this because I kept seeing the same problem{" "}
                <span className={styles.span}>
                  — black car operators running premium services out of booking
                  software that was never designed for how they actually work.
                  So I started building.
                </span>
              </p>
              <p className={styles.copy}>
                The audit tool to show operators where their business is
                leaking. The lead tool to find the accounts worth having.{" "}
                <span className={styles.span}>
                  The website platform — built from the ground up, deployed with
                  a real operator in Phoenix, and refined until it worked the
                  way the business actually needed it to. Everything here was
                  built for black car operators specifically. That&apos;s the
                  difference you&apos;ll feel from the first product you use.
                </span>
              </p>
            </div>
          </div>
          <div className={styles.bottom}>
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
        </div>
      </LayoutWrapper>
    </section>
  );
}
