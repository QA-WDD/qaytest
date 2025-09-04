import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ProjectMembersSection } from "@/components/project-members-section"

interface ProjectPageProps {
  params: { id: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user has access to this project
  const { data: projectMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", id)
    .eq("user_id", data.user.id)
    .single()

  if (!projectMember) {
    redirect("/projects")
  }

  // Get project details
  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      users!projects_created_by_fkey (
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single()

  if (!project) {
    redirect("/projects")
  }

  // Get project members
  const { data: members } = await supabase
    .from("project_members")
    .select(`
      *,
      users (
        id,
        full_name,
        email,
        role:user_role
      )
    `)
    .eq("project_id", id)

  // Get project statistics
  const { count: testCasesCount } = await supabase
    .from("test_cases")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id)

  const { count: bugsCount } = await supabase
    .from("bugs")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "archived":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "completed":
        return "Completado"
      case "archived":
        return "Archivado"
      default:
        return status
    }
  }

  const canManageProject = projectMember.role === "admin" || projectMember.role === "lead"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Detalles del proyecto</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-border bg-transparent">
              <Link href="/projects">Volver a Proyectos</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Project Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-card-foreground">Información del Proyecto</CardTitle>
                  <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{project.description || "Sin descripción"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-card-foreground">Creado por:</span>
                    <p className="text-muted-foreground">{project.users?.full_name || "Desconocido"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-card-foreground">Fecha de creación:</span>
                    <p className="text-muted-foreground">{new Date(project.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Statistics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Casos de Prueba</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{testCasesCount || 0}</div>
                  <p className="text-muted-foreground text-sm">casos creados</p>
                  <Button asChild className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    <Link href={`/projects/${id}/test-cases`}>Ver Casos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Bugs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{bugsCount || 0}</div>
                  <p className="text-muted-foreground text-sm">bugs reportados</p>
                  <Button asChild className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href={`/projects/${id}/bugs`}>Ver Bugs</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Project Members */}
          <div>
            <ProjectMembersSection
              projectId={id}
              members={members || []}
              canManage={canManageProject}
              currentUserRole={projectMember.role}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
