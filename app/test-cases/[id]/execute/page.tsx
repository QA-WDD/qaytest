"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExecuteTestCasePageProps {
  params: Promise<{ id: string }>;
}

type Step = {
  action: string;
  expected: string;
  completed?: boolean;
};

export default function ExecuteTestCasePage({
  params,
}: ExecuteTestCasePageProps) {
  const [testCase, setTestCase] = useState<any>(null);
  const [status, setStatus] = useState("not_executed");
  const [actualResult, setActualResult] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testCaseId, setTestCaseId] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);

  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTestCaseId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!testCaseId) return;

    const loadTestCase = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("test_cases")
        .select(
          `
          *,
          projects (
            id,
            name
          )
        `
        )
        .eq("id", testCaseId)
        .single();

      if (error || !data) {
        router.push("/test-cases");
        return;
      }

      setTestCase(data);

      // Cargar pasos parseados
      try {
        const parsedSteps: Step[] = JSON.parse(data.steps || "[]");
        setSteps(parsedSteps);
      } catch {
        setSteps([]);
      }
    };

    loadTestCase();
  }, [testCaseId, router]);

  const handleToggleStep = (index: number) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      completed: !updatedSteps[index].completed,
    };
    setSteps(updatedSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Registrar la ejecución
      const { error: executionError } = await supabase
        .from("test_executions")
        .insert({
          test_case_id: testCaseId,
          executed_by: user.id,
          status,
          actual_result: actualResult,
          notes,
          steps_status: steps,
        });

      if (executionError) throw executionError;

      // 🔥 Actualizar estado del test case según el resultado
      if (status === "passed") {
        await supabase
          .from("test_cases")
          .update({ status: "closed" })
          .eq("id", testCaseId);
      } else if (status === "failed") {
        await supabase
          .from("test_cases")
          .update({ status: "active" })
          .eq("id", testCaseId);
      }

      router.push(`/test-cases/${testCaseId}`);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al registrar la ejecución"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Calcular porcentaje completado
  const completionPercentage = useMemo(() => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter((s) => s.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [steps]);

  if (!testCase) {
    return <div>Cargando...</div>;
  }

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Ejecutar Caso de Prueba
            </h1>
            <p className="text-sm text-muted-foreground">
              {testCase.projects?.name}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent"
          >
            <Link href={`/test-cases/${testCaseId}`}>Cancelar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Test Case Information */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                {testCase.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Información del caso de prueba a ejecutar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testCase.description && (
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Descripción
                  </h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {testCase.description}
                  </p>
                </div>
              )}

              {testCase.preconditions && (
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">
                    Precondiciones
                  </h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {testCase.preconditions}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-card-foreground mb-2">
                  Pasos a Seguir
                </h4>
                <table className="w-full border border-border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Acción</th>
                      <th className="px-2 py-1 text-left">
                        Resultado Esperado
                      </th>
                      <th className="px-2 py-1 text-center">Completado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((step, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-1">{index + 1}</td>
                        <td className="px-2 py-1">{step.action}</td>
                        <td className="px-2 py-1">{step.expected}</td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={step.completed ?? false}
                            onChange={() => handleToggleStep(index)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-card-foreground mb-2">
                  Resultado Esperado Global
                </h4>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {testCase.expected_result}
                </p>
                {/* ✅ Mostrar progreso */}
                <div className="mt-2">
                  <span className="text-sm font-medium">
                    Progreso: {completionPercentage}%
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Form */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Registrar Ejecución
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Completa los resultados de la ejecución
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-card-foreground">
                    Estado de la Ejecución *
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">Pasó</SelectItem>
                      <SelectItem value="failed">Falló</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                      <SelectItem value="skipped">Omitido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={getStatusColor(status)}>
                    {status === "passed"
                      ? "Pasó"
                      : status === "failed"
                      ? "Falló"
                      : status === "blocked"
                      ? "Bloqueado"
                      : status === "skipped"
                      ? "Omitido"
                      : "No Ejecutado"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="actualResult"
                    className="text-card-foreground"
                  >
                    Resultado Actual
                  </Label>
                  <Textarea
                    id="actualResult"
                    placeholder="Describe qué ocurrió durante la ejecución..."
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    className="bg-input border-border text-foreground min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-card-foreground">
                    Notas Adicionales
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones, problemas encontrados, sugerencias..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-input border-border text-foreground min-h-[100px]"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Guardando..." : "Registrar Ejecución"}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-border bg-transparent"
                  >
                    <Link href={`/test-cases/${testCaseId}`}>Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
