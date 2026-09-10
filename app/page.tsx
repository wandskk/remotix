import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");
  redirect("/client/dashboard");
}
