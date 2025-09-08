"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TestCasesPageProps } from "./type";
import useTestCasesPage from "./useTestCases";

export default async function TestCasesPage({
  searchParams,
}: TestCasesPageProps) {
  const {
    projects,
    testCases,
    currentProject,
    selectedProjectId,
    filterStatus,
    getStatusColor,
    getPriorityColor,
  } = await useTestCasesPage(searchParams);

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
