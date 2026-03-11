import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./ProjectSection.module.css";
import Nier from "../../../../public/images/nierLogo.png";
import Image from "next/image";
import NierHomePage from "../../../../public/images/nierHomePage.png";
import Button from "../../shared/Button/Button";

export default function ProjectSection() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.parent}>
          <div className={styles.content}>
            <div className={styles.left}>
              <div className={styles.logoContainer}>
                <Image
                  src={Nier}
                  alt='Nier Transportation Logo'
                  title='Nier Transportation Logo'
                  className={styles.img}
                />
                <span className={styles.logoText}>Nier Transportation</span>
              </div>
              <h2 className={styles.heading}>
                Feature Project: <br /> Nier Transportation
              </h2>
              <div className={styles.imgContainerii}>
                <Image
                  src={NierHomePage}
                  alt='Nier Transportation Home Page'
                  title='Nier Transportation Home Page'
                  fill
                  className={styles.imgRight}
                />
              </div>
              <p>
                Nier Transportation is a transportation company that provides
                transportation services to the public. They have a fleet of
                buses that are used for transportation services.
                <br />
                <br />
                <span className={styles.accent}>
                  They also have a website that allows customers to book
                  transportation services and view their schedule. The website
                  is also integrated with a payment gateway that allows
                  customers to pay for their transportation services online.
                </span>
              </p>
              <div className={styles.statBox}>
                <div className={styles.statLeft}>
                  <span className={styles.detail}>Duplicate work</span>
                  <span className={`${styles.heading} h1`}>-27%</span>
                </div>
                <div className={styles.statRight}>
                  <span className={styles.detail}>On-time delivery</span>
                  <span className={`${styles.heading} h1`}>+42%</span>
                </div>
              </div>
              <div className={styles.btnContainer}>
                <Button
                  href='https://www.niertransportation.com/'
                  target='_blank'
                  text='see live site'
                  btnType='accent'
                  arrow
                />
              </div>
            </div>
            <div className={styles.right}>
              <div className={styles.imgContainer}>
                <Image
                  src={NierHomePage}
                  alt='Nier Transportation Home Page'
                  title='Nier Transportation Home Page'
                  fill
                  className={styles.imgRight}
                />
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
