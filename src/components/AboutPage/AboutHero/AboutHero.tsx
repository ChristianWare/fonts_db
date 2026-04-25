import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AboutHero.module.css";
// import Image from "next/image";
import BgImage from "../../../../public/images/cadiii.png";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image from "next/image";
// import Button from "@/components/shared/Button/Button";

export default function AboutHero() {
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
              <Nav variant='black' hamburgerColor='hamburgerBlack' />{" "}
            </div>
            <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='About Us' />
                <h1 className={styles.heading}>
                  Built for one industry. <br />{" "}
                  <span className={styles.accent}>Built for yours.</span>
                </h1>
              </div>
              <div className={styles.b2}>
                <div className={styles.b2Left}>
                  <p className={styles.copy}>
                    Fonts & Footers is a growth platform built exclusively for
                    black car and limo operators.
                    <span className={styles.span}>
                      {" "}
                      Not adapted from a generic tool, not pointed at your
                      industry — built for it from the ground up.
                    </span>
                  </p>
                </div>
                <div className={styles.b2Right}>
                  <div className={styles.imgContainer}>
                    <Image
                      src={BgImage}
                      alt='About Us'
                      title='About Us'
                      fill
                      className={styles.img}
                    />
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
