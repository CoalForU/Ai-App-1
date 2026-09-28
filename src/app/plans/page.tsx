import Link from "next/link";
import styles from "./plans.module.css";

const plans = [
  {
    name: "Basic",
    price: "$0",
    cadence: "forever",
    blurb: "Feel the loop. Scan a few finds a month.",
    featured: false,
    perks: [
      { label: "~7 scans / month", included: true },
      { label: "Sell-through data", included: true },
      { label: "Listing generation", included: true },
      { label: "Background removal", included: false },
      { label: "Priority support", included: false },
      { label: "Custom notifications", included: false },
      { label: "Price alerts", included: false },
      { label: "Market data", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$15",
    cadence: "/ month",
    blurb: "For part-time flippers who scan every weekend.",
    featured: true,
    perks: [
      { label: "~25 scans / month", included: true },
      { label: "Sell-through data", included: true },
      { label: "Listing generation", included: true },
      { label: "Background removal", included: true },
      { label: "Priority support", included: true },
      { label: "Custom notifications", included: true },
      { label: "Price alerts", included: false },
      { label: "Market data", included: false },
    ],
  },
  {
    name: "Ultimate",
    price: "$35",
    cadence: "/ month",
    blurb: "Unlimited sourcing for full-time resellers.",
    featured: false,
    perks: [
      { label: "Unlimited scans", included: true },
      { label: "Sell-through data", included: true },
      { label: "Listing generation", included: true },
      { label: "Background removal", included: true },
      { label: "Priority support", included: true },
      { label: "Custom notifications", included: true },
      { label: "Price alerts", included: true },
      { label: "Market data", included: true },
    ],
  },
] as const;

export default function PlansPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          ← Back to scan
        </Link>
        <p className={styles.brand}>FlipScout</p>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Plans</h1>
          <p>
            Basic gets you hooked. Pro is the weekend flipper pick. Ultimate is
            for people who live in thrift stores.
          </p>
        </div>

        <div className={styles.grid}>
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`${styles.card} ${plan.featured ? styles.featured : ""}`}
            >
              {plan.featured && <p className={styles.badge}>Most popular</p>}
              <h2>{plan.name}</h2>
              <p className={styles.price}>
                <span>{plan.price}</span>
                <small>{plan.cadence}</small>
              </p>
              <p className={styles.blurb}>{plan.blurb}</p>
              <ul>
                {plan.perks.map((perk) => (
                  <li
                    key={perk.label}
                    className={perk.included ? styles.yes : styles.no}
                  >
                    <span aria-hidden>{perk.included ? "✓" : "—"}</span>
                    {perk.label}
                  </li>
                ))}
              </ul>
              <button type="button" className={styles.cta} disabled>
                {plan.name === "Basic" ? "Current plan" : "Coming in Phase 5"}
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
