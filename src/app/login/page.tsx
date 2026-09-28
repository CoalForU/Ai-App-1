import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import styles from "../auth.module.css";

export default function LoginPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/">← Resellr</Link>
        <Link href="/signup">Need an account?</Link>
      </header>
      <AuthForm mode="login" />
    </div>
  );
}
