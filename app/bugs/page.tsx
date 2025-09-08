// app/bugs/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import ProjectSwitcherClient from "./ProjectSwitcherClient";

interface BugsPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function BugsPage({ searchParams }: BugsPageProps) {
  const { project: selectedProjectId } = await searchParams;
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

  const projects = (userProjects ?? []).flatMap((up: any) =>
    up?.projects
      ? [{ id: String(up.projects.id), name: String(up.projects.name) }]
      : []
  );

  // If no project selected, redirect to first available project
  if (!selectedProjectId && projects.length > 0) {
    redirect(`/bugs?project=${projects[0].id}`);
  }

  // Get bugs for selected project (if any)
  const { data: bugs } = await supabase
    .from("bugs")
    .select(
      `
      *,
      users!bugs_reported_by_fkey ( full_name ),
      assigned_user:users!bugs_assigned_to_fkey ( full_name ),
      test_cases ( title )
    `
    )
    .eq("project_id", selectedProjectId ?? projects[0]?.id ?? null)
    .order("created_at", { ascending: false });

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const getStatusText = (s: string) => {
    switch (s) {
      case "open":
        return "Abierto";
      case "in_progress":
        return "En Progreso";
      case "resolved":
        return "Resuelto";
      case "closed":
        return "Cerrado";
      case "reopened":
        return "Reabierto";
      default:
        return s;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // --- UI (server-rendered) ---
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Bugs</h1>
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
              <Link
                href={`/bugs/new?project=${
                  selectedProjectId ?? projects[0]?.id ?? ""
                }`}
              >
                Reportar Bug
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Project selector is a client component (no server-side handlers passed) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Proyecto:
          </label>
          <ProjectSwitcherClient
            projects={projects}
            selectedProjectId={selectedProjectId ?? ""}
          />
        </div>

        {/* Bugs grid (server-rendered) */}
        {bugs && bugs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bugs.map((bug: any) => (
              <Card
                key={bug.id}
                className="border-border hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-card-foreground text-base leading-tight">
                      {bug.title}
                    </CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(bug.status)}>
                        {getStatusText(bug.status)}
                      </Badge>
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
                        <span className="font-medium">Reportado por:</span>{" "}
                        {bug.users?.full_name || "Desconocido"}
                      </p>
                      {bug.assigned_user && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Asignado a:</span>{" "}
                          {bug.assigned_user.full_name}
                        </p>
                      )}
                      {bug.test_cases && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Caso de prueba:</span>{" "}
                          {bug.test_cases.title}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(bug.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    >
                      <Link href={`/bugs/${bug.id}`}>Ver Detalles</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              No hay bugs reportados
            </h3>
            <p className="text-muted-foreground mb-6">
              Reporta el primer bug para este proyecto.
            </p>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link
                href={`/bugs/new?project=${
                  selectedProjectId ?? projects[0]?.id ?? ""
                }`}
              >
                Reportar Primer Bug
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
