"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./WebsitesPageHero.module.css";
import Nav from "@/components/shared/Nav/Nav";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Cursor from "@/components/shared/icons/Cursor/Cursor";

export default function WebsitesPageHero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper borderDark>
        <div className={styles.parent}>
          <div className={styles.dot1} />
          <div className={styles.dot2} />
          <div className={styles.dot3} />
          <div className={styles.dot4} />
          <div className={styles.content}>
            <div className={styles.topParent}>
              <Nav variant='black' hamburgerColor='hamburgerBlack' />{" "}
            </div>
            <div className={styles.top}>
              <div className={styles.topLeft}>
                <div className={styles.imagContainer}>
                  <Cursor className={styles.icon} />
                </div>
              </div>
              <div className={styles.topRight}>
                <SectionIntro
                  text='Product 03 of 03'
                  background='bgBlack'
                  color='colorWhite'
                />
                <h1 className={`${styles.heading} h2`}>
                  A website that closes the deal{" "}
                  <span className={styles.accent}>
                    {" "}
                    after you make the call
                  </span>
                </h1>

                <h3 className={`${styles.subheading} h6`}>
                  $499/month · Everything included · No setup fee · Cancel
                  anytime
                </h3>
                {/*  fixes it */}
                <p className={styles.copy}>
                  We didn&apos;t build a generic tool and point it at the
                  transportation industry. Every product was built from the
                  ground up for black car operators specifically — the way you
                  work, the clients you chase, and the problems you actually
                  face. Each one works on its own, but they&apos;re designed to
                  work together.
                </p>
              </div>
            </div>
            {/* <div className={styles.bottom}>
              <div className={styles.b1}>
                <SectionIntro text='Free Audit' />
                <h1 className={`${styles.heading} h2`}>
                  A website that closes the deal <br />{" "}
                  <span className={styles.accent}>
                    after you make the call.{" "}
                  </span>
                </h1>
              </div>
              <div className={styles.b2}>
                <div className={styles.b2Left}>
                  <p className={styles.copy}>
                    The Fonts & Footers audit tool analyzes your website across
                    the factors that determine whether you get found, whether
                    visitors trust you, and whether your site actually converts.
                    Free, instant results, with the full report sent straight to
                    your inbox.
                  </p>
                  <div className={styles.btnContainer}>
                    <Button text='Try it for free' btnType='black' arrow />
                  </div>
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
            </div> */}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}

// WebsitesPageHero;
