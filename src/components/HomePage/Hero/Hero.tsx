import styles from "./Hero.module.css";
import Image from "next/image";
import LayoutWrapper from "../../shared/LayoutWrapper";
import Nav from "../../shared/Nav/Nav";
import BgImage from "../../../../public/images/newHero.png";
// import HeroScrollButton from "./HeroScrollButton";
import Button from "@/components/shared/Button/Button";

export default function Hero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper lightGrayBorder>
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
                Audits. Leads.
                <span className={styles.accent}> Websites.</span>
              </div>
              <h1 className={styles.heading}>
                {/* Audits. Leads. <br /> Websites. */}
                {/* Black Car & Limo Operators */}
                {/* Black Car & Limo Operators <br /> */}
                {/* Black Car & limo <br /> Growth Solutions */}
                Expand your
                <br /> Chauffeur Business
              </h1>
              <div className={styles.copyBtnContainer}>
                <p className={styles.copy}>
                  Fonts & Footers is the only growth platform built exclusively
                  for black car and limo operators. A free website audit, a lead
                  generation tool, and a custom booking website —
                  <span className={styles.span}>
                    three solutions designed to work together and grow your
                    business from the ground up.
                  </span>
                </p>
                <div className={styles.btnContainer}>
                  <Button
                    href='/audit'
                    text='Run your free audit'
                    btnType='accent'
                    arrow
                  />
                  {/* <Button
                    href='/leads'
                    text='Get leads to your market'
                    btnType='white'
                    arrow
                  /> */}
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
