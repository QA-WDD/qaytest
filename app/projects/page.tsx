import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  // Get user's projects
  const { data: projects } = await supabase
    .from("project_members")
    .select(`
      project_id,
      role,
      projects (
        id,
        name,
        description,
        status,
        created_at,
        users!projects_created_by_fkey (
          full_name
        )
      )
    `)
    .eq("user_id", data.user.id)

  // Normalize relation shape: ensure `projects` is a single object (not an array)
  const normalizedMembers =
    (projects as any[] | null | undefined)?.map((member) => ({
      ...member,
      projects: Array.isArray(member.projects) ? member.projects[0] : member.projects,
    })) ?? []

  const canCreateProjects =
    (userProfile?.role === "admin" || userProfile?.role === "lead") ||
    normalizedMembers.some((m) => m.role === "lead")

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Proyectos</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus proyectos de testing</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-border bg-transparent">
              <Link href="/dashboard">Volver al Dashboard</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/projects/new">Crear Proyecto</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {normalizedMembers && normalizedMembers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {normalizedMembers.map((projectMember) => {
              const project = projectMember.projects
              const createdBy = Array.isArray(project?.users)
                ? project.users[0]?.full_name
                : project?.users?.full_name
              return (
                <Card key={project?.id} className="border-border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-card-foreground">{project?.name}</CardTitle>
                      <Badge className={getStatusColor(project?.status)}>{getStatusText(project?.status)}</Badge>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      {project?.description || "Sin descripción"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Creado por:</span> {createdBy || "Desconocido"}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">Tu rol:</span>{" "}
                          {projectMember.role === "admin" ? "Admin" : projectMember.role === "lead" ? "Lead" : "Tester"}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">Creado:</span>{" "}
                          {project?.created_at ? new Date(project.created_at).toLocaleDateString("es-ES") : "-"}
                        </p>
                      </div>
                      <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        <Link href={`/projects/${project?.id}`}>Ver Detalles</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-card-foreground mb-2">No tienes proyectos asignados</h3>
            <p className="text-muted-foreground mb-6">
              Contacta a tu administrador para que te asigne a un proyecto o crea uno nuevo si tienes permisos.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/projects/new">Crear Primer Proyecto</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
