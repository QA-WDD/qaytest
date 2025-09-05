"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import Link from "next/link";

type Step = { action: string; expected: string };

const supabase = createClient();

export default function EditTestCasePage() {
  const params = useParams();
  const router = useRouter();
  const testCaseId = params.id;

  // Estados
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preconditions, setPreconditions] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ action: "", expected: "" }]);
  const [expectedResult, setExpectedResult] = useState("");
  const [status, setStatus] = useState("draft");
  const [priority, setPriority] = useState("medium");
  const [month, setMonth] = useState("");
  const [sprint, setSprint] = useState("");
  const [storyId, setStoryId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState("");
  const [caseNumber, setCaseNumber] = useState<number | null>(null);
  const [createdBy, setCreatedBy] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [projectOptions, setProjectOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [priorityOptions, setPriorityOptions] = useState<
    { priority_value: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // 1. Proyectos
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name");
      if (!projectsError && projectsData) setProjectOptions(projectsData);

      // 2. Prioridades
      const { data: prioritiesData, error: prioritiesError } =
        await supabase.rpc("get_bug_priority");
      if (!prioritiesError && prioritiesData)
        setPriorityOptions(prioritiesData);

      // 3. Test case
      const { data: testCase, error: testCaseError } = await supabase
        .from("test_cases")
        .select("*")
        .eq("id", testCaseId)
        .single();

      if (testCaseError || !testCase) {
        console.error("Error fetching test case:", testCaseError);
        setIsLoading(false);
        return;
      }

      // Asignar valores a estados
      setTitle(testCase.title || "");
      setDescription(testCase.description || "");
      setPreconditions(testCase.preconditions || "");
      setSteps(
        testCase.steps
          ? JSON.parse(testCase.steps)
          : [{ action: "", expected: "" }]
      );
      setExpectedResult(testCase.expected_result || "");
      setStatus(testCase.status || "draft");
      setPriority(testCase.priority || "medium");
      setMonth(testCase.month || "");
      setSprint(testCase.sprint || "");
      setStoryId(testCase.story_id ?? null);
      setProjectId(testCase.project_id || "");
      setCaseNumber(testCase.case_number ?? null);
      setCreatedBy(testCase.users?.name || "");
      setCreatedAt(testCase.created_at || "");
      setUpdatedAt(testCase.updated_at || "");

      setIsLoading(false);
    };

    fetchData();
  }, [testCaseId]);

  // Funciones para steps
  const addStep = () => setSteps([...steps, { action: "", expected: "" }]);
  const updateStep = (
    index: number,
    field: "action" | "expected",
    value: string
  ) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  // Guardar cambios
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCaseId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtener usuario actual
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error("Usuario no autenticado");

      // Obtener test case actual
      const { data: oldTestCase, error: oldError } = await supabase
        .from("test_cases")
        .select("*")
        .eq("id", testCaseId)
        .single();
      if (oldError || !oldTestCase)
        throw new Error("No se encontró el test case");

      // Valores actuales
      const currentValues = {
        project_id: projectId,
        title,
        description,
        preconditions,
        steps: JSON.stringify(steps),
        expected_result: expectedResult,
        status,
        priority,
        month,
        sprint,
        story_id: storyId,
      };

      // Actualizar test case
      const { error: updateError } = await supabase
        .from("test_cases")
        .update(currentValues)
        .eq("id", testCaseId);
      if (updateError) throw updateError;

      const fieldsToCheck = Object.keys(
        currentValues
      ) as (keyof typeof currentValues)[];

      const historyInserts = fieldsToCheck
        .filter((field) => {
          const oldValue = oldTestCase[field];
          const newValue = currentValues[field];
          return oldValue !== newValue;
        })
        .map((field) => ({
          test_case_id: testCaseId,
          field_name: field,
          old_value: oldTestCase[field],
          new_value: currentValues[field],
          changed_by: user.id,
        }));

      if (historyInserts.length > 0) {
        const { data, error: historyError } = await supabase
          .from("test_case_history")
          .insert(historyInserts);

        if (historyError) {
          console.error("Error guardando historial:", historyError);
        } else {
          console.log("Historial guardado:", data);
        }
      }

      router.push(`/test-cases/${testCaseId}`);
    } catch (err: any) {
      setError(err.message || "Error al actualizar");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-card-foreground">
            Editar Caso de Prueba
          </h1>
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent"
          >
            <Link href={`/test-cases`}>Cancelar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Información del Caso de Prueba
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Edita los datos del caso de prueba seleccionado
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {/* Proyecto */}
                <div className="space-y-2">
                  <Label>Proyecto</Label>
                  <Select value={projectId} onValueChange={() => {}} disabled>
                    <SelectTrigger className="bg-input border-border text-foreground cursor-default">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={projectId}>
                        {projectOptions.find((p) => p.id === projectId)?.name ||
                          ""}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridad */}
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={priority} onValueChange={() => {}} disabled>
                    <SelectTrigger className="bg-input border-border text-foreground cursor-default">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={priority}>{priority}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mes */}
                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Input
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    disabled
                  />
                </div>

                {/* Sprint */}
                <div className="space-y-2">
                  <Label>Sprint</Label>
                  <Input
                    value={sprint}
                    onChange={(e) => setSprint(e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Número de Historia */}
                <div className="space-y-2">
                  <Label>Número de Historia</Label>
                  <Input
                    type="number"
                    value={storyId ?? ""}
                    onChange={(e) => setStoryId(Number(e.target.value))}
                    disabled
                  />
                </div>

                {/* Número del TestCase */}
                <div className="space-y-2">
                  <Label>Número del TestCase</Label>
                  <Input value={caseNumber ?? ""} disabled />
                </div>
              </div>
              {/* Mensaje de error */}
              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Título */}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Precondiciones */}
              <div className="space-y-2">
                <Label>Precondiciones</Label>
                <Textarea
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                />
              </div>

              {/* Pasos */}
              <div>
                <h4 className="font-medium text-card-foreground mb-2">
                  Pasos y Resultados *
                </h4>

                <div className="border rounded-lg overflow-x-auto">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-auto mx-auto">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 w-1/12 text-center">#</th>
                          <th className="px-4 py-2 w-5/12 text-left">Acción</th>
                          <th className="px-4 py-2 w-5/12 text-left">
                            Resultado Esperado
                          </th>
                          <th className="px-4 py-2 w-1/12 text-center">
                            Acciones
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {steps.map((step, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-4 py-2 text-center align-middle">
                              {i + 1}
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <Textarea
                                value={step.action}
                                onChange={(e) =>
                                  updateStep(i, "action", e.target.value)
                                }
                                placeholder="Acción"
                                className="w-full resize-none"
                              />
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <Textarea
                                value={step.expected}
                                onChange={(e) =>
                                  updateStep(i, "expected", e.target.value)
                                }
                                placeholder="Resultado esperado"
                                className="w-full resize-none"
                              />
                            </td>
                            <td className="px-4 py-2 text-center align-middle">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  const newSteps = steps.filter(
                                    (_, idx) => idx !== i
                                  );
                                  setSteps(newSteps);
                                }}
                                className="p-2"
                                title="Eliminar paso"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 p-2">
                    <Button type="button" onClick={addStep} variant="outline">
                      + Añadir Paso
                    </Button>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                  </SelectContent>
                </Select>
                {/* Botón de actualizar */}
                <Button type="submit">
                  {isLoading ? "Actualizando..." : "Actualizar Caso de Prueba"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
