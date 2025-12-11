'use client';

import { useRouter } from "next/navigation";
import { AuthPage } from "@/components/AuthPage";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthPage
      onAuth={() => router.push("/")}
      onShowSignup={() => router.push("/register")}
    />
  );
}
