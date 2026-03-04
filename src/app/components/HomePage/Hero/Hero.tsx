import LayoutWrapper from "../../shared/LayoutWrapper";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <h1 className={styles.heading}>Yo Son!</h1>
          <p className={styles.copy}>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aspernatur quae soluta architecto quam quidem excepturi neque consequuntur dolorem voluptates nam, dolore placeat nemo nisi incidunt pariatur sint quis non veritatis.
          </p>
        </div>
      </LayoutWrapper>
    </section>
  );
}
