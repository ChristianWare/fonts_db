 import LayoutWrapper from '@/components/shared/LayoutWrapper';
import styles from './Footer.module.css';
 
 export default function Footer() {
   return (
     <footer className={styles.container}>
        <LayoutWrapper>
            <div className={styles.conta}>
                <h2>Footer</h2>
            </div>
        </LayoutWrapper>
     </footer>
   )
 }
 