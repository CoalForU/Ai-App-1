import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import styles from "../auth.module.css";

export default function SignupPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← FlipScout</Link>
        <Link href="/login">Already have an account?</Link>
      </header>
      <AuthForm mode="signup" />
    </div>
  );
}
