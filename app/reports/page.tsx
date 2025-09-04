"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Bug, TestTube, Users, TrendingUp, Download } from "lucide-react"

interface ProjectStats {
  id: string
  name: string
  total_bugs: number
  open_bugs: number
  resolved_bugs: number
  total_test_cases: number
  passed_tests: number
  failed_tests: number
  pending_tests: number
}

interface BugTrend {
  date: string
  created: number
  resolved: number
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<ProjectStats[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [bugTrends, setBugTrends] = useState<BugTrend[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchReportsData()
  }, [selectedProject])

  const fetchReportsData = async () => {
    try {
      const { data: projectsData } = await supabase.from("projects").select(`
          id,
          name,
          bugs!inner(id, status),
          test_cases!inner(id),
          test_executions!inner(id, status)
        `)

      const projectStats: ProjectStats[] =
        projectsData?.map((project) => ({
          id: project.id,
          name: project.name,
          total_bugs: project.bugs?.length || 0,
          open_bugs: project.bugs?.filter((bug) => ["abierto", "en_progreso"].includes(bug.status)).length || 0,
          resolved_bugs: project.bugs?.filter((bug) => ["resuelto", "cerrado"].includes(bug.status)).length || 0,
          total_test_cases: project.test_cases?.length || 0,
          passed_tests: project.test_executions?.filter((exec) => exec.status === "pasado").length || 0,
          failed_tests: project.test_executions?.filter((exec) => exec.status === "fallido").length || 0,
          pending_tests: project.test_executions?.filter((exec) => exec.status === "pendiente").length || 0,
        })) || []

      setProjects(projectStats)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: bugsData } = await supabase
        .from("bugs")
        .select("created_at, updated_at, status")
        .gte("created_at", thirtyDaysAgo.toISOString())

      // Process bug trends data
      const trendsMap = new Map<string, { created: number; resolved: number }>()

      bugsData?.forEach((bug) => {
        const createdDate = new Date(bug.created_at).toISOString().split("T")[0]
        const current = trendsMap.get(createdDate) || { created: 0, resolved: 0 }
        current.created += 1

        if (["resuelto", "cerrado"].includes(bug.status)) {
          const resolvedDate = new Date(bug.updated_at).toISOString().split("T")[0]
          const resolvedCurrent = trendsMap.get(resolvedDate) || { created: 0, resolved: 0 }
          resolvedCurrent.resolved += 1
          trendsMap.set(resolvedDate, resolvedCurrent)
        }

        trendsMap.set(createdDate, current)
      })

      const trends = Array.from(trendsMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setBugTrends(trends)
    } catch (error) {
      console.error("Error fetching reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  const aggregatedStats = projects.reduce(
    (acc, project) => ({
      total_bugs: acc.total_bugs + project.total_bugs,
      open_bugs: acc.open_bugs + project.open_bugs,
      resolved_bugs: acc.resolved_bugs + project.resolved_bugs,
      total_test_cases: acc.total_test_cases + project.total_test_cases,
      passed_tests: acc.passed_tests + project.passed_tests,
      failed_tests: acc.failed_tests + project.failed_tests,
      pending_tests: acc.pending_tests + project.pending_tests,
    }),
    {
      total_bugs: 0,
      open_bugs: 0,
      resolved_bugs: 0,
      total_test_cases: 0,
      passed_tests: 0,
      failed_tests: 0,
      pending_tests: 0,
    },
  )

  const bugStatusData = [
    { name: "Abiertos", value: aggregatedStats.open_bugs, color: "#ef4444" },
    { name: "Resueltos", value: aggregatedStats.resolved_bugs, color: "#22c55e" },
  ]

  const testStatusData = [
    { name: "Pasados", value: aggregatedStats.passed_tests, color: "#22c55e" },
    { name: "Fallidos", value: aggregatedStats.failed_tests, color: "#ef4444" },
    { name: "Pendientes", value: aggregatedStats.pending_tests, color: "#f59e0b" },
  ]

  const exportReport = () => {
    const reportData = {
      fecha_reporte: new Date().toISOString(),
      proyecto:
        selectedProject === "all" ? "Todos los proyectos" : projects.find((p) => p.id === selectedProject)?.name,
      estadisticas: aggregatedStats,
      proyectos: selectedProject === "all" ? projects : projects.filter((p) => p.id === selectedProject),
      tendencias: bugTrends,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-${selectedProject}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

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
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Métricas</h1>
          <p className="text-gray-600 mt-1">Análisis detallado del rendimiento de pruebas y bugs</p>
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

          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Bugs</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.total_bugs}</div>
            <p className="text-xs text-muted-foreground">
              {aggregatedStats.open_bugs} abiertos, {aggregatedStats.resolved_bugs} resueltos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos de Prueba</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.total_test_cases}</div>
            <p className="text-xs text-muted-foreground">Total de casos creados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedStats.total_test_cases > 0
                ? Math.round(
                    (aggregatedStats.passed_tests / (aggregatedStats.passed_tests + aggregatedStats.failed_tests)) *
                      100,
                  ) || 0
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">De pruebas ejecutadas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">En seguimiento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Bugs</CardTitle>
            <CardDescription>Distribución actual de bugs por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bugStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bugStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {bugStatusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Pruebas</CardTitle>
            <CardDescription>Resultados de ejecución de casos de prueba</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={testStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Bugs (Últimos 30 días)</CardTitle>
          <CardDescription>Bugs creados vs resueltos por día</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={bugTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="created" stroke="#ef4444" name="Creados" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resueltos" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desglose por Proyecto</CardTitle>
          <CardDescription>Métricas detalladas de cada proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Proyecto</th>
                  <th className="text-left p-3 font-medium">Total Bugs</th>
                  <th className="text-left p-3 font-medium">Bugs Abiertos</th>
                  <th className="text-left p-3 font-medium">Casos de Prueba</th>
                  <th className="text-left p-3 font-medium">Tasa de Éxito</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const successRate =
                    project.passed_tests + project.failed_tests > 0
                      ? Math.round((project.passed_tests / (project.passed_tests + project.failed_tests)) * 100)
                      : 0

                  return (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{project.name}</td>
                      <td className="p-3">
                        <Badge variant="outline">{project.total_bugs}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={project.open_bugs > 0 ? "destructive" : "secondary"}>{project.open_bugs}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{project.total_test_cases}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={successRate >= 80 ? "default" : successRate >= 60 ? "secondary" : "destructive"}
                        >
                          {successRate}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
