import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

interface TestCasePageProps {
  params: Promise<{ id: string }>;
}

export default async function TestCasePage({ params }: TestCasePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Test case
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

  // Check membership
  const { data: projectMember } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", testCase.project_id)
    .eq("user_id", data.user.id)
    .single();

  if (!projectMember) {
    redirect("/test-cases");
  }

  // Recent executions
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

  // History
  // History
  const { data: history, error: historyError } = await supabase
    .from("test_case_history")
    .select(
      `
    id,
    field_name,
    old_value,
    new_value,
    changed_at,
    users!test_case_history_changed_by_fkey (
      id,
      full_name
    )
  `
    )
    .eq("test_case_id", id)
    .order("changed_at", { ascending: false })
    .limit(10);

  if (historyError) {
    console.error("Error fetching history:", historyError);
  }

  // Helpers
  const safeParseSteps = (raw: any): { action: string; expected: string }[] => {
    if (!raw) return [];
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(raw)) return raw;
    return [];
  };

  const safeParseStepsStatus = (raw: any): any[] => {
    if (!raw) return [];
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(raw)) return raw;
    return [];
  };

  const stepsArray = safeParseSteps(testCase.steps);
  const latestStepsStatus = safeParseStepsStatus(executions?.[0]?.steps_status);

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
            <Button
              asChild
              /*     variant="secondary" */
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href={`/test-cases/${id}/edit`}>Editar Caso</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Test Case Details (main column) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex justify-between items-start w-full">
                  <CardTitle className="text-card-foreground">
                    Detalles del Caso de Prueba
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(testCase.status)}>
                      {testCase.status === "active"
                        ? "Activo"
                        : testCase.status === "draft"
                        ? "Borrador"
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
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Número de Test Case
                    </label>
                    <input
                      type="text"
                      value={testCase.case_number ?? ""}
                      readOnly
                      className="border rounded p-2 w-full bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Historia Asociada
                    </label>
                    <input
                      type="text"
                      value={testCase.story_id ?? ""}
                      readOnly
                      className="border rounded p-2 w-full bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Título</label>
                    <input
                      type="text"
                      value={testCase.title ?? ""}
                      readOnly
                      className="border rounded p-2 w-full bg-gray-100"
                    />
                  </div>
                </div>

                {/* Description */}
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

                {/* Preconditions */}
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

                {/* Steps (with disabled checkboxes reflecting latest execution) */}
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Pasos a Seguir
                  </h4>
                  {stepsArray.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">#</th>
                            <th className="px-4 py-2 text-left">Acción</th>
                            <th className="px-4 py-2 text-left">
                              Resultado Esperado
                            </th>
                            <th className="px-4 py-2 text-center">
                              Completado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stepsArray.map((step: any, index: number) => {
                            const checked = Boolean(
                              latestStepsStatus?.[index]?.completed
                            );
                            return (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-2">{index + 1}.</td>
                                <td className="px-4 py-2">{step.action}</td>
                                <td className="px-4 py-2">{step.expected}</td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled
                                    className="h-4 w-4 text-primary border-gray-300 rounded"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No hay pasos registrados
                    </p>
                  )}
                </div>

                {/* Expected result */}
                {/* Expected result */}
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Resultado Esperado
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap mb-2">
                    {testCase.expected_result}
                  </p>

                  {stepsArray.length > 0 &&
                    (() => {
                      const totalSteps = stepsArray.length;
                      const completedSteps = latestStepsStatus.filter(
                        (s: any) => s?.completed
                      ).length;
                      const percentage =
                        totalSteps > 0
                          ? Math.round((completedSteps / totalSteps) * 100)
                          : 0;

                      return (
                        <p className="text-sm text-card-foreground font-medium">
                          Ejecución alcanzada:{" "}
                          <span className="text-primary">{percentage}%</span> (
                          {completedSteps}/{totalSteps} pasos completados)
                        </p>
                      );
                    })()}
                </div>

                {/* Meta: creado por / fecha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t border-border">
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
                    {executions.map((execution: any) => (
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
                  history.map((change: any) => (
                    <div
                      key={change.id}
                      className="text-sm border-l-2 border-primary pl-3"
                    >
                      <p className="font-medium text-card-foreground">
                        {change.field_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        por {change.users?.full_name ?? "Desconocido"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(change.changed_at).toLocaleString("es-ES")}
                      </p>

                      {/* Formateo especial para steps */}
                      {change.field_name === "steps" ? (
                        <div className="text-xs mt-1">
                          <p className="text-red-600">Anterior:</p>
                          <ul className="list-disc pl-5 text-red-600">
                            {JSON.parse(change.old_value || "[]").map(
                              (step: any, index: number) => (
                                <li key={index}>
                                  Acción: {step.action}, Esperado:{" "}
                                  {step.expected}
                                </li>
                              )
                            )}
                          </ul>
                          <p className="text-green-600">Nuevo:</p>
                          <ul className="list-disc pl-5 text-green-600">
                            {JSON.parse(change.new_value || "[]").map(
                              (step: any, index: number) => (
                                <li key={index}>
                                  Acción: {step.action}, Esperado:{" "}
                                  {step.expected}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : (
                        <>
                          {change.old_value && (
                            <p className="text-xs text-red-600 mt-1">
                              Anterior:{" "}
                              {change.old_value.length > 80
                                ? `${change.old_value.substring(0, 80)}...`
                                : change.old_value}
                            </p>
                          )}
                          {change.new_value && (
                            <p className="text-xs text-green-600">
                              Nuevo:{" "}
                              {change.new_value.length > 80
                                ? `${change.new_value.substring(0, 80)}...`
                                : change.new_value}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))
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
