import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateProjectForm } from "@/features/projects/components/CreateProjectForm";

export const metadata = { title: "New Project — AI CTO" };

export default async function NewProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <CreateProjectForm />;
}
