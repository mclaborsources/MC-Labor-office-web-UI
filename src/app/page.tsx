import { redirect } from "next/navigation";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSessionOrDefault();
  if (session.isLoggedIn) {
    redirect("/tracking");
  }
  redirect("/login");
}
