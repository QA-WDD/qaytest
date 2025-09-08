"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEditTestCase } from "./useEditTestCase";

export default function EditTestCasePageUI() {
  const params = useParams();
  const testCaseId = params.id;

  const {
    title,
    setTitle,
    description,
    setDescription,
    preconditions,
    setPreconditions,
    steps,
    addStep,
    updateStep,
    status,
    setStatus,
    priority,
    setPriority,
    month,
    setMonth,
    sprint,
    setSprint,
    storyId,
    setStoryId,
    projectId,
    caseNumber,
    projectOptions,
    isLoading,
    error,
    handleUpdate,
    setSteps,
  } = useEditTestCase(testCaseId);

  if (isLoading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-card-foreground">
            Editar Caso de Prueba
          </h1>
          <Button asChild variant="outline">
            <Link href={`/test-cases`}>Cancelar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Caso de Prueba</CardTitle>
            <CardDescription>
              Edita los datos del caso de prueba
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
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as "draft" | "active")
                  }
                >
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
