import { redirect } from "next/navigation";
import { safeApplicationPath } from "@/server/auth/redirects";

export const metadata = { title: "Pilih peran" };

export default async function RolePage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const query = await searchParams;
  const rawNextPath = typeof query.next === "string" ? query.next : null;
  const nextPath = rawNextPath ? safeApplicationPath(rawNextPath, "/account/continue") : undefined;
  redirect(nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register");
}
