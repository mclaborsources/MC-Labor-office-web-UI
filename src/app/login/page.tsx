import { redirect } from "next/navigation";
import { needsAccountSetup } from "@/lib/config/env";
import LoginForm from "@/components/LoginForm";
import { isLocalMode } from "@/lib/auth/mode";

export const dynamic = "force-dynamic";
export default function LoginPage() {
  if (isLocalMode()) redirect("/");
  if (needsAccountSetup()) redirect("/welcome");
  return <LoginForm />;
}
