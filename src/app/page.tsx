import {isSqlDisconnected} from "@/lib/db/connection-state";
import { redirect } from "next/navigation";
import { getSessionOrDefault } from "@/lib/auth/session";

export default async function HomePage() {
  if(isSqlDisconnected())redirect("/setup");
  const session = await getSessionOrDefault();
  if (session.isLoggedIn) {
    redirect("/dashboard");
  }
  redirect("/login");
}
