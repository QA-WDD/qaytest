"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useNewTestCase } from "./useNewTestCase";

type Step = { action: string; expected: string };
type Project = { id: string; name: string };

export default function NewTestCasePage() {
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
    error,
    isLoading,
    projects,
    selectedProject,
    setSelectedProject,
    storyId,
    setStoryId,
    handleSubmit,
  } = useNewTestCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Crear Caso de Prueba
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea un nuevo caso de prueba
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent"
          >
            <Link
              href={`/test-cases${
                selectedProject ? `?project=${selectedProject}` : ""
              }`}
            >
              Cancelar
            </Link>
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
              Completa los datos para crear un nuevo caso de prueba
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Proyecto, Prioridad, Mes y Sprint */}
              <div className="grid gap-6 md:grid-cols-4">
                {/* Proyecto */}
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-card-foreground">
                    Proyecto *
                  </Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecciona un proyecto" />
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

                {/* Prioridad */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-card-foreground">
                    Prioridad
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value: string) =>
                      setPriority(
                        value as "low" | "medium" | "high" | "critical"
                      )
                    }
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mes */}
                <div className="space-y-2">
                  <Label htmlFor="month" className="text-card-foreground">
                    Mes
                  </Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecciona un mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enero">Enero</SelectItem>
                      <SelectItem value="febrero">Febrero</SelectItem>
                      <SelectItem value="marzo">Marzo</SelectItem>
                      <SelectItem value="abril">Abril</SelectItem>
                      <SelectItem value="mayo">Mayo</SelectItem>
                      <SelectItem value="junio">Junio</SelectItem>
                      <SelectItem value="julio">Julio</SelectItem>
                      <SelectItem value="agosto">Agosto</SelectItem>
                      <SelectItem value="septiembre">Septiembre</SelectItem>
                      <SelectItem value="octubre">Octubre</SelectItem>
                      <SelectItem value="noviembre">Noviembre</SelectItem>
                      <SelectItem value="diciembre">Diciembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sprint */}
                <div className="space-y-2">
                  <Label htmlFor="sprint" className="text-card-foreground">
                    Sprint
                  </Label>
                  <Select value={sprint} onValueChange={setSprint}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecciona un sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S1">S1</SelectItem>
                      <SelectItem value="S2">S2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/*             <div>
                  <Label
                    htmlFor="número de Test Case"
                    className="text-card-foreground"
                  >
                    Número de Test Case
                  </Label>
                  <input
                    type="text"
                    value={caseNumber || "Se generará automáticamente"}
                    readOnly
                    className="border rounded p-2 w-full bg-gray-100"
                  />
                </div> */}

                {/* Número de historia */}
                <div>
                  <Label
                    htmlFor="historia asociada"
                    className="text-card-foreground"
                  >
                    Historia asociada
                  </Label>
                  <input
                    type="number"
                    value={storyId ?? ""}
                    onChange={(e) => setStoryId(Number(e.target.value))}
                    className=" bg-input border rounded p-2 w-full"
                  />
                </div>

                {/* Título */}
                <div>
                  <Label htmlFor="título" className="text-card-foreground">
                    Título
                  </Label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-input border rounded p-2 w-full"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-card-foreground">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el objetivo del caso de prueba..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[80px]"
                />
              </div>

              {/* Precondiciones */}
              <div className="space-y-2">
                <Label htmlFor="preconditions" className="text-card-foreground">
                  Precondiciones
                </Label>
                <Textarea
                  id="preconditions"
                  placeholder="Condiciones que deben cumplirse antes de ejecutar el caso..."
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[80px]"
                />
              </div>

              {/* Pasos */}
              <div>
                <h4 className="font-medium text-card-foreground mb-2">
                  Pasos y Resultados *
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Acción</th>
                        <th className="px-4 py-2 text-left">
                          Resultado Esperado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{index + 1}.</td>
                          <td className="px-4 py-2">
                            <Textarea
                              value={step.action}
                              onChange={(e) =>
                                updateStep(index, "action", e.target.value)
                              }
                              placeholder="Escribe la acción..."
                              className="w-full bg-input border-border"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Textarea
                              value={step.expected}
                              onChange={(e) =>
                                updateStep(index, "expected", e.target.value)
                              }
                              placeholder="Escribe el resultado esperado..."
                              className="w-full bg-input border-border"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  onClick={addStep}
                  type="button"
                  variant="outline"
                  className="mt-3"
                >
                  + Añadir Paso
                </Button>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-card-foreground">
                  Estado
                </Label>
                <Select
                  value={status}
                  onValueChange={(value: string) =>
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
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando..." : "Crear Caso de Prueba"}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-border bg-transparent"
                >
                  <Link
                    href={`/test-cases${
                      selectedProject ? `?project=${selectedProject}` : ""
                    }`}
                  >
                    Cancelar
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
