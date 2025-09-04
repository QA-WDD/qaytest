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

interface TestCasePageProps {
  params: Promise<{ id: string }>;
}

export default async function TestCasePage({ params }: TestCasePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get test case details
  const { data: testCase } = await supabase
    .from("test_cases")
    .select(
      `
      *,
      users!test_cases_created_by_fkey (
        full_name,
        email
      ),
      projects (
        id,
        name
      )
    `
    )
    .eq("id", id)
    .single();

  if (!testCase) {
    redirect("/test-cases");
  }

  // Check if user has access to this project
  const { data: projectMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", testCase.project_id)
    .eq("user_id", data.user.id)
    .single();

  if (!projectMember) {
    redirect("/test-cases");
  }

  // Get recent executions
  const { data: executions } = await supabase
    .from("test_executions")
    .select(
      `
      *,
      users!test_executions_executed_by_fkey (
        full_name
      )
    `
    )
    .eq("test_case_id", id)
    .order("execution_date", { ascending: false })
    .limit(5);

  // Get test case history
  const { data: history } = await supabase
    .from("test_case_history")
    .select(
      `
      *,
      users!test_case_history_changed_by_fkey (
        full_name
      )
    `
    )
    .eq("test_case_id", id)
    .order("changed_at", { ascending: false })
    .limit(10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "deprecated":
        return "bg-red-100 text-red-800 border-red-200";
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

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "blocked":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "skipped":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "not_executed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getExecutionStatusText = (status: string) => {
    switch (status) {
      case "passed":
        return "Pasó";
      case "failed":
        return "Falló";
      case "blocked":
        return "Bloqueado";
      case "skipped":
        return "Omitido";
      case "not_executed":
        return "No Ejecutado";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              {testCase.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {testCase.projects?.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-border bg-transparent"
            >
              <Link href={`/test-cases?project=${testCase.project_id}`}>
                Volver a Casos
              </Link>
            </Button>
            <Button
              asChild
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href={`/test-cases/${id}/execute`}>Ejecutar Caso</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Test Case Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-card-foreground">
                    Detalles del Caso de Prueba
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(testCase.status)}>
                      {testCase.status === "active"
                        ? "Activo"
                        : testCase.status === "draft"
                        ? "Borrador"
                        : "Obsoleto"}
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {testCase.description && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">
                      Descripción
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {testCase.description}
                    </p>
                  </div>
                )}

                {testCase.preconditions && (
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">
                      Precondiciones
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {testCase.preconditions}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Pasos a Seguir
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {testCase.steps}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Resultado Esperado
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {testCase.expected_result}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-border">
                  <div>
                    <span className="font-medium text-card-foreground">
                      Creado por:
                    </span>
                    <p className="text-muted-foreground">
                      {testCase.users?.full_name || "Desconocido"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-card-foreground">
                      Fecha de creación:
                    </span>
                    <p className="text-muted-foreground">
                      {new Date(testCase.created_at).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Executions */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Ejecuciones Recientes
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Últimas 5 ejecuciones de este caso de prueba
                </CardDescription>
              </CardHeader>
              <CardContent>
                {executions && executions.length > 0 ? (
                  <div className="space-y-3">
                    {executions.map((execution) => (
                      <div
                        key={execution.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={getExecutionStatusColor(
                                execution.status
                              )}
                            >
                              {getExecutionStatusText(execution.status)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              por {execution.users?.full_name || "Desconocido"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.execution_date).toLocaleString(
                              "es-ES"
                            )}
                          </p>
                          {execution.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {execution.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay ejecuciones registradas
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History Sidebar */}
          <div>
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
                            {change.old_value.length > 50
                              ? `${change.old_value.substring(0, 50)}...`
                              : change.old_value}
                          </p>
                        )}
                        {change.new_value && (
                          <p className="text-xs text-green-600">
                            Nuevo:{" "}
                            {change.new_value.length > 50
                              ? `${change.new_value.substring(0, 50)}...`
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
