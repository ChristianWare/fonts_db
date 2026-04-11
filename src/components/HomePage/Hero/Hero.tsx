import styles from "./Hero.module.css";
import Image from "next/image";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Nav from "../../shared/Nav/Nav";
import BgImage from "../../../../public/images/heroiv.png";
import HeroScrollButton from "./HeroScrollButton";

export default function Hero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.backgroundImgContainer}>
            <div />
            <div className={styles.imgContainer}>
              <Image
                src={BgImage}
                alt='Background Image'
                fill
                className={styles.img}
              />
              <div className={styles.overlay} />
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.top}>
              <Nav />
            </div>
            <div className={styles.bottom}>
              <div className={styles.topCopy}>
                Websites Built exclusively for{" "}
                <span className={styles.accent}>
                  black car & limo companies
                </span>
              </div>
              <h1 className={styles.heading}>
                Custom Direct <br /> booking websites
              </h1>
              <div className={styles.copyBtnContainer}>
                <p className={styles.copy}>
                  Stop paying a platform to rent your own customers. We build
                  black car operators a direct booking platform they actually
                  own —{" "}
                  <span className={styles.span}>
                    {" "}
                    so every ride earns more, every client stays yours, and your
                    brand looks like the premium service you already are.
                  </span>
                </p>
                <div className={styles.btnContainer}>
                  <HeroScrollButton />
                </div>
              </div>
              <div className={styles.imgContainerii}>
                <Image
                  src={BgImage}
                  alt='Background Image'
                  fill
                  className={styles.img}
                />
                <div className={styles.overlay} />
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
