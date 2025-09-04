import { redirect } from "next/navigation"

interface ProjectTestCasesPageProps {
  params: { id: string }
}

export default function ProjectTestCasesPage({ params }: ProjectTestCasesPageProps) {
  const { id } = params
  redirect(`/test-cases?project=${id}`)
}


