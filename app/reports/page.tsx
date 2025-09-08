"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bug, TestTube, Users, TrendingUp, Download } from "lucide-react";
import { useReports } from "./useReports";

export default function ReportsPage() {
  const {
    projects,
    selectedProject,
    setSelectedProject,
    bugTrends,
    loading,
    aggregatedStats,
  } = useReports();

  const exportReport = () => {
    const reportData = {
      fecha_reporte: new Date().toISOString(),
      proyecto:
        selectedProject === "all"
          ? "Todos los proyectos"
          : projects.find((p) => p.id === selectedProject)?.name,
      estadisticas: projects,
      proyectos:
        selectedProject === "all"
          ? projects
          : projects.filter((p) => p.id === selectedProject),
      tendencias: bugTrends,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${selectedProject}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reportes y Métricas
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado del rendimiento de pruebas y bugs
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={exportReport}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total de Bugs */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Bugs</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedStats.total_bugs}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregatedStats.open_bugs} abiertos,{" "}
              {aggregatedStats.resolved_bugs} resueltos
            </p>
          </CardContent>
        </Card>

        {/* Casos de Prueba */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Casos de Prueba
            </CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedStats.total_test_cases}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de casos creados
            </p>
          </CardContent>
        </Card>

        {/* Tasa de Éxito Global */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedStats.total_bugs + aggregatedStats.total_test_cases > 0
                ? Math.round(
                    ((aggregatedStats.resolved_bugs +
                      aggregatedStats.closed_test_cases) /
                      (aggregatedStats.total_bugs +
                        aggregatedStats.total_test_cases)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              De bugs y casos cerrados
            </p>
          </CardContent>
        </Card>

        {/* Proyectos Activos */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proyectos Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">En seguimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Proyecto */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Proyecto</CardTitle>
          <CardDescription>
            Métricas detalladas de cada proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Proyecto</th>
                  <th className="text-left p-3 font-medium">Total Bugs</th>
                  <th className="text-left p-3 font-medium">Bugs Abiertos</th>
                  <th className="text-left p-3 font-medium">Bugs Cerrados</th>
                  <th className="text-left p-3 font-medium">Casos de Prueba</th>
                  <th className="text-left p-3 font-medium">Casos Activos</th>
                  <th className="text-left p-3 font-medium">Casos Cerrados</th>
                  <th className="text-left p-3 font-medium">Tasa de Éxito</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const projectSuccessRate =
                    project.total_bugs + project.total_test_cases > 0
                      ? Math.round(
                          ((project.resolved_bugs + project.closed_test_cases) /
                            (project.total_bugs + project.total_test_cases)) *
                            100
                        )
                      : 0;

                  return (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{project.name}</td>
                      <td className="p-3">
                        <Badge variant="outline">{project.total_bugs}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            project.open_bugs > 0
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-green-100 text-green-700 border border-green-300"
                          }`}
                        >
                          {project.open_bugs > 0
                            ? `${project.open_bugs} abiertos`
                            : "Sin bugs"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            project.resolved_bugs > 0
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-gray-100 text-gray-500 border border-gray-300"
                          }`}
                        >
                          {project.resolved_bugs} cerrados
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {project.total_test_cases}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {project.active_test_cases}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {project.closed_test_cases}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            projectSuccessRate >= 80
                              ? "default"
                              : projectSuccessRate >= 60
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {projectSuccessRate}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
