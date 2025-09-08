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
import { BugCommentsSection } from "@/components/bug-comments-section";
import { BugStatusUpdate } from "@/components/bug-status-update";

interface BugPageProps {
  params: Promise<{ id: string }>;
}

export default async function BugPage({ params }: BugPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get bug details
  const { data: bug } = await supabase
    .from("bugs")
    .select(
      `
      *,
      users!bugs_reported_by_fkey (
        full_name,
        email
      ),
      assigned_user:users!bugs_assigned_to_fkey (
        full_name,
        email
      ),
      projects (
        id,
        name
      ),
      test_cases (
        id,
        title
      )
    `
    )
    .eq("id", id)
    .single();

  if (!bug) {
    redirect("/bugs");
  }

  // Check if user has access to this project
  const { data: projectMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", bug.project_id)
    .eq("user_id", data.user.id)
    .single();

  if (!projectMember) {
    redirect("/bugs");
  }

  // Get bug comments
  const { data: comments } = await supabase
    .from("bug_comments")
    .select(
      `
      *,
      users!bug_comments_created_by_fkey (
        full_name
      )
    `
    )
    .eq("bug_id", id)
    .order("created_at", { ascending: true });

  // Get bug history
  const { data: history } = await supabase
    .from("bug_history")
    .select(
      `
      *,
      users!bug_history_changed_by_fkey (
        full_name
      )
    `
    )
    .eq("bug_id", id)
    .order("changed_at", { ascending: false })
    .limit(10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "reopened":
        return "bg-orange-100 text-orange-800 border-orange-200";
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "blocker":
        return "bg-red-100 text-red-800 border-red-200";
      case "critical":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "major":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "minor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
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
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "critical":
        return "Crítica";
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "blocker":
        return "Bloqueante";
      case "critical":
        return "Crítica";
      case "major":
        return "Mayor";
      case "minor":
        return "Menor";
      default:
        return severity;
    }
  };

  const canManageBug =
    projectMember.role === "admin" ||
    projectMember.role === "lead" ||
    bug.assigned_to === data.user.id;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              {bug.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {bug.projects?.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-border bg-transparent"
            >
              <Link href={`/bugs?project=${bug.project_id}`}>
                Volver a Bugs
              </Link>
            </Button>
            {bug.test_cases && (
              <Button
                asChild
                variant="outline"
                className="border-border bg-transparent"
              >
                <Link href={`/test-cases/${bug.test_cases.id}`}>
                  Ver Caso de Prueba
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bug Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-card-foreground">
                    Detalles del Bug
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(bug.status)}>
                      {getStatusText(bug.status)}
                    </Badge>
                    <Badge className={getPriorityColor(bug.priority)}>
                      {getPriorityText(bug.priority)}
                    </Badge>
                    <Badge className={getSeverityColor(bug.severity)}>
                      {getSeverityText(bug.severity)}
                    </Badge>
                    {bug.bug_number && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                         BUG - {bug.bug_number}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Descripción
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {bug.description}
                  </p>
                </div>

                {/*    {bug.steps_to_reproduce && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">Pasos para Reproducir</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{bug.steps_to_reproduce}</p>
                  </div>
                )}

                {bug.expected_behavior && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">Comportamiento Esperado</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{bug.expected_behavior}</p>
                  </div>
                )}

                {bug.actual_behavior && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">Comportamiento Actual</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{bug.actual_behavior}</p>
                  </div>
                )} */}

                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-border">
                  <div>
                    <span className="font-medium text-card-foreground">
                      Reportado por:
                    </span>
                    <p className="text-muted-foreground">
                      {bug.users?.full_name || "Desconocido"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-card-foreground">
                      Asignado a:
                    </span>
                    <p className="text-muted-foreground">
                      {bug.assigned_user?.full_name || "Sin asignar"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-card-foreground">
                      Fecha de reporte:
                    </span>
                    <p className="text-muted-foreground">
                      {new Date(bug.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  {bug.resolved_at && (
                    <div>
                      <span className="font-medium text-card-foreground">
                        Fecha de resolución:
                      </span>
                      <p className="text-muted-foreground">
                        {new Date(bug.resolved_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  )}
                  {bug.test_cases && (
                    <div className="col-span-2">
                      <span className="font-medium text-card-foreground">
                        Caso de prueba relacionado:
                      </span>
                      <p className="text-muted-foreground">
                        {bug.test_cases.title}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <BugCommentsSection bugId={id} comments={comments || []} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            {canManageBug && (
              <BugStatusUpdate
                bugId={id}
                currentStatus={bug.status}
                currentPriority={bug.priority}
                currentSeverity={bug.severity}
                currentAssignedTo={bug.assigned_to}
                projectId={bug.project_id}
              />
            )}

            {/* History */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Historial de Cambios
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Últimos cambios realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history && history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((change) => (
                      <div
                        key={change.id}
                        className="text-sm border-l-2 border-primary pl-3"
                      >
                        <p className="font-medium text-card-foreground">
                          {change.field_name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          por {change.users?.full_name || "Desconocido"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(change.changed_at).toLocaleString("es-ES")}
                        </p>
                        {change.old_value && (
                          <p className="text-xs text-red-600 mt-1">
                            Anterior:{" "}
                            {change.old_value.length > 30
                              ? `${change.old_value.substring(0, 30)}...`
                              : change.old_value}
                          </p>
                        )}
                        {change.new_value && (
                          <p className="text-xs text-green-600">
                            Nuevo:{" "}
                            {change.new_value.length > 30
                              ? `${change.new_value.substring(0, 30)}...`
                              : change.new_value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Sin cambios registrados
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
