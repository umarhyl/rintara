import { redirect } from "next/navigation";

export default function FirstOpportunityPage() {
  redirect("/jobs?opportunity=first");
}
