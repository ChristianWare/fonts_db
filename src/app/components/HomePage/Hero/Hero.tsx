import LayoutWrapper from "../../shared/LayoutWrapper";
import Nav from "../../shared/Nav/Nav";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
            <h1 className={styles.heading}>
              Your Business Is Premium. Your Booking Experience Should Be
              Too.{" "}
            </h1>
        <div className={styles.content}>
          <div className={styles.left}>
            <p className={styles.copy}>
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              Aspernatur quae soluta architecto quam quidem excepturi neque
              consequuntur dolorem voluptates nam, dolore placeat nemo nisi
              incidunt pariatur sint quis non veritatis.
            </p>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
