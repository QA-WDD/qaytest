import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface TestCasesPageProps {
  searchParams: Promise<{ project?: string; status?: string }>;
}

export default async function TestCasesPage({
  searchParams,
}: TestCasesPageProps) {
  const { project: selectedProjectId, status: filterStatus } =
    await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user's projects
  const { data: userProjects } = await supabase
    .from("project_members")
    .select(
      `
      project_id,
      projects (
        id,
        name
      )
    `
    )
    .eq("user_id", data.user.id);

  const projects: Project[] =
    userProjects
      ?.map((up) => {
        const proj = up.projects;
        if (Array.isArray(proj)) {
          return proj[0] as Project;
        }
        return proj as Project;
      })
      .filter((p): p is Project => !!p) || [];

  if (!selectedProjectId && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-card-foreground">
              Casos de Prueba
            </h1>
            <p className="text-sm text-muted-foreground">
              No tienes proyectos asignados
            </p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Necesitas estar asignado a un proyecto para ver casos de prueba.
            </p>
            <Button asChild>
              <Link href="/projects">Ver Proyectos</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!selectedProjectId && projects.length > 0) {
    redirect(`/test-cases?project=${projects[0].id}`);
  }

  // Get test cases for selected project + status filter
  let query = supabase
    .from("test_cases")
    .select(
      `
      *,
      users!test_cases_created_by_fkey (
        full_name
      )
    `
    )
    .eq("project_id", selectedProjectId)
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: testCases } = await query;

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "deprecated":
        return "bg-red-100 text-red-800 border-red-200";
      case "closed":
        return "bg-gray-300 text-gray-800 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Casos de Prueba
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentProject?.name || "Proyecto no encontrado"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-border bg-transparent"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href={`/test-cases/new?project=${selectedProjectId}`}>
                Crear Caso de Prueba
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Project & Status Filters */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Project Selector */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Proyecto:
            </label>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  asChild
                  variant={
                    project.id === selectedProjectId ? "default" : "outline"
                  }
                  className={
                    project.id === selectedProjectId
                      ? "bg-primary text-primary-foreground"
                      : "border-border"
                  }
                >
                  <Link href={`/test-cases?project=${project.id}`}>
                    {project.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Estado Filtro */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Filtrar por estado:
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant={
                  filterStatus === "all" || !filterStatus
                    ? "default"
                    : "outline"
                }
              >
                <Link
                  href={`/test-cases?project=${selectedProjectId}&status=all`}
                >
                  Todos
                </Link>
              </Button>
              <Button
                asChild
                variant={filterStatus === "active" ? "default" : "outline"}
              >
                <Link
                  href={`/test-cases?project=${selectedProjectId}&status=active`}
                >
                  Activos
                </Link>
              </Button>
              <Button
                asChild
                variant={filterStatus === "closed" ? "default" : "outline"}
              >
                <Link
                  href={`/test-cases?project=${selectedProjectId}&status=closed`}
                >
                  Cerrados
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Test Cases Grid */}
        {testCases && testCases.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testCases.map((testCase) => (
              <Card
                key={testCase.id}
                className="border-border hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-card-foreground text-base leading-tight">
                      {testCase.title}
                    </CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(testCase.status)}>
                        {testCase.status === "active"
                          ? "Activo"
                          : testCase.status === "draft"
                          ? "Borrador"
                          : testCase.status === "deprecated"
                          ? "Obsoleto"
                          : "Cerrado"}
                      </Badge>
                      <Badge className={getPriorityColor(testCase.priority)}>
                        {testCase.priority === "critical"
                          ? "Crítica"
                          : testCase.priority === "high"
                          ? "Alta"
                          : testCase.priority === "medium"
                          ? "Media"
                          : "Baja"}
                      </Badge>
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                        Test Case # {testCase.case_number}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {testCase.description
                      ? testCase.description.length > 100
                        ? `${testCase.description.substring(0, 100)}...`
                        : testCase.description
                      : "Sin descripción"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Creado por:</span>{" "}
                        {testCase.users?.full_name || "Desconocido"}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(testCase.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      >
                        <Link href={`/test-cases/${testCase.id}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <Link href={`/test-cases/${testCase.id}/execute`}>
                          Ejecutar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              No hay casos de prueba
            </h3>
            <p className="text-muted-foreground mb-6">
              Crea el primer caso de prueba para este proyecto.
            </p>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href={`/test-cases/new?project=${selectedProjectId}`}>
                Crear Primer Caso
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
