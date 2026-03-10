import styles from "./Hero.module.css";
import Image from "next/image";
import Button from "../../shared/Button/Button";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Nav from "../../shared/Nav/Nav";
import BgImage from "../../../../../public/images/heroii.jpg";

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
                {/* Premium rides. <br /> Premium platform. */}
                Your fleet. <br /> Your platform.{" "}
              </h1>
              <div className={styles.copyBtnContainer}>
                <p className={styles.copy}>
                  We build custom direct-booking websites and platforms
                  exclusively for black car and limousine companies —{" "}
                  <span className={styles.span}>
                    {" "}
                    complete with a branded booking engine, admin dashboard,
                    driver portal, corporate accounts, payment processing, and
                    more.
                  </span>
                </p>
                <div className={styles.btnContainer}>
                  <Button
                    href='/'
                    text='Book your discovery call'
                    btnType='accent'
                    arrow
                  />
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
