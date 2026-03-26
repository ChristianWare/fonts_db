/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClientBlueprintPages } from "@/actions/client/getClientBlueprintPages";
import ClientBlueprintView from "@/components/portal/ClientBlueprintView/ClientBlueprintView";
import styles from "./BlueprintPage.module.css";

export default async function BlueprintPage() {
  const pages = await getClientBlueprintPages();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Website Blueprint</h1>
        <p className={styles.desc}>
          Review the sitemap and copy plan for your platform. Approve each
          section once you&apos;re happy with the content direction.
        </p>
      </div>

      {!pages || pages.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            Your blueprint isn&apos;t ready yet.
          </p>
          <p className={styles.emptyDesc}>
            We&apos;ll publish your sitemap and page-by-page copy plan here once
            your questionnaire has been reviewed. Check back soon.
          </p>
        </div>
      ) : (
        <ClientBlueprintView initialPages={pages as any} />
      )}
    </div>
  );
}
