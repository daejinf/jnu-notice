import { redirect } from "next/navigation";

export default async function MyAlertsPage() {
  redirect("/updates?tab=alerts");
}
