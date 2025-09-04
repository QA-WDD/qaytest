
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface BugsPageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function BugsPage({ searchParams }: BugsPageProps) {
  const { project: selectedProjectId } = await searchParams
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's projects
  const { data: userProjects } = await supabase
    .from("project_members")
    .select(`
      project_id,
      projects (
        id,
        name
      )
    `)
    .eq("user_id", data.user.id)

  const projects = userProjects?.map((up) => up.projects).filter(Boolean) || []

  // If no project selected, redirect to first available project
  if (!selectedProjectId && projects.length > 0) {
    redirect(`/bugs?project=${projects[0].id}`)
  }

  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-card-foreground">Bugs</h1>
            <p className="text-sm text-muted-foreground">No tienes proyectos asignados</p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Necesitas estar asignado a un proyecto para ver bugs.</p>
            <Button asChild>
              <Link href="/projects">Ver Proyectos</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Get bugs for selected project
  const { data: bugs } = await supabase
    .from("bugs")
    .select(`
      *,
      users!bugs_reported_by_fkey (
        full_name
      ),
      assigned_user:users!bugs_assigned_to_fkey (
        full_name
      ),
      test_cases (
        title
      )
    `)
    .eq("project_id", selectedProjectId)
    .order("created_at", { ascending: false })

  // Get current project info
  const currentProject = projects.find((p) => p.id === selectedProjectId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "reopened":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "blocker":
        return "bg-red-100 text-red-800 border-red-200"
      case "critical":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "major":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "minor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Abierto"
      case "in_progress":
        return "En Progreso"
      case "resolved":
        return "Resuelto"
      case "closed":
        return "Cerrado"
      case "reopened":
        return "Reabierto"
      default:
        return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "critical":
        return "Crítica"
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
      default:
        return priority
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "blocker":
        return "Bloqueante"
      case "critical":
        return "Crítica"
      case "major":
        return "Mayor"
      case "minor":
        return "Menor"
      default:
        return severity
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Bugs</h1>
            <p className="text-sm text-muted-foreground">{currentProject?.name || "Proyecto no encontrado"}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-border bg-transparent">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href={`/bugs/new?project=${selectedProjectId}`}>Reportar Bug</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Project Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-card-foreground mb-2">Proyecto:</label>
          <Select
            value={selectedProjectId}
            onValueChange={(value) => (window.location.href = `/bugs?project=${value}`)}
          >
            <SelectTrigger className="w-64 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bugs Grid */}
        {bugs && bugs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bugs.map((bug) => (
              <Card key={bug.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-card-foreground text-base leading-tight">{bug.title}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(bug.status)}>{getStatusText(bug.status)}</Badge>
                      <Badge className={getPriorityColor(bug.priority)}>{getPriorityText(bug.priority)}</Badge>
                      <Badge className={getSeverityColor(bug.severity)}>{getSeverityText(bug.severity)}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {bug.description
                      ? bug.description.length > 100
                        ? `${bug.description.substring(0, 100)}...`
                        : bug.description
                      : "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Reportado por:</span> {bug.users?.full_name || "Desconocido"}
                      </p>
                      {bug.assigned_user && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Asignado a:</span> {bug.assigned_user.full_name}
                        </p>
                      )}
                      {bug.test_cases && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Caso de prueba:</span> {bug.test_cases.title}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(bug.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <Link href={`/bugs/${bug.id}`}>Ver Detalles</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-card-foreground mb-2">No hay bugs reportados</h3>
            <p className="text-muted-foreground mb-6">Reporta el primer bug para este proyecto.</p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href={`/bugs/new?project=${selectedProjectId}`}>Reportar Primer Bug</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
