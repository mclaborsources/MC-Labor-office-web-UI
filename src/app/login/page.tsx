import { redirect } from "next/navigation";
import { needsAccountSetup } from "@/lib/config/env";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";
export default function LoginPage() {
  if (needsAccountSetup()) redirect("/welcome");
  return <LoginForm />;
}
