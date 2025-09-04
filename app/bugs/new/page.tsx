"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function NewBugPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [stepsToReproduce, setStepsToReproduce] = useState("")
  const [expectedBehavior, setExpectedBehavior] = useState("")
  const [actualBehavior, setActualBehavior] = useState("")
  const [priority, setPriority] = useState("medium")
  const [severity, setSeverity] = useState("minor")
  const [assignedTo, setAssignedTo] = useState("")
  const [testCaseId, setTestCaseId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [testCases, setTestCases] = useState<any[]>([])

  const router = useRouter()
  const searchParams = useSearchParams()
  const projectFromUrl = searchParams.get("project")
  const testCaseFromUrl = searchParams.get("testCase")

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Load user's projects
        const { data: userProjects } = await supabase
          .from("project_members")
          .select(`
            project_id,
            projects (
              id,
              name
            )
          `)
          .eq("user_id", user.id)

        const projectsList = userProjects?.map((up) => up.projects).filter(Boolean) || []
        setProjects(projectsList)

        if (projectFromUrl && projectsList.find((p) => p.id === projectFromUrl)) {
          setSelectedProject(projectFromUrl)
        } else if (projectsList.length > 0) {
          setSelectedProject(projectsList[0].id)
        }

        if (testCaseFromUrl) {
          setTestCaseId(testCaseFromUrl)
        }
      }
    }

    loadData()
  }, [projectFromUrl, testCaseFromUrl])

  useEffect(() => {
    if (!selectedProject) return

    const loadProjectData = async () => {
      const supabase = createClient()

      // Load project members
      const { data: members } = await supabase
        .from("project_members")
        .select(`
          users (
            id,
            full_name,
            email
          )
        `)
        .eq("project_id", selectedProject)

      setProjectMembers(members?.map((m) => m.users).filter(Boolean) || [])

      // Load test cases
      const { data: cases } = await supabase
        .from("test_cases")
        .select("id, title")
        .eq("project_id", selectedProject)
        .eq("status", "active")

      setTestCases(cases || [])
    }

    loadProjectData()
  }, [selectedProject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      if (!selectedProject) throw new Error("Debe seleccionar un proyecto")

      const { data: bug, error: bugError } = await supabase
        .from("bugs")
        .insert({
          project_id: selectedProject,
          test_case_id: testCaseId || null,
          title,
          description,
          steps_to_reproduce: stepsToReproduce,
          expected_behavior: expectedBehavior,
          actual_behavior: actualBehavior,
          priority,
          severity,
          reported_by: user.id,
          assigned_to: assignedTo || null,
        })
        .select()
        .single()

      if (bugError) throw bugError

      router.push(`/bugs/${bug.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear el bug")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Reportar Bug</h1>
            <p className="text-sm text-muted-foreground">Crea un nuevo reporte de bug</p>
          </div>
          <Button asChild variant="outline" className="border-border bg-transparent">
            <Link href={`/bugs${selectedProject ? `?project=${selectedProject}` : ""}`}>Cancelar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Información del Bug</CardTitle>
            <CardDescription className="text-muted-foreground">
              Completa los datos para reportar un nuevo bug
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-card-foreground">
                    Proyecto *
                  </Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
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

                <div className="space-y-2">
                  <Label htmlFor="testCase" className="text-card-foreground">
                    Caso de Prueba (Opcional)
                  </Label>
                  <Select value={testCaseId} onValueChange={setTestCaseId}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecciona un caso de prueba" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {testCases.map((testCase) => (
                        <SelectItem key={testCase.id} value={testCase.id}>
                          {testCase.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-card-foreground">
                  Título *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ej: Error al iniciar sesión con credenciales válidas"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-card-foreground">
                  Descripción *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el problema encontrado..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[100px]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-card-foreground">
                    Prioridad
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
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

                <div className="space-y-2">
                  <Label htmlFor="severity" className="text-card-foreground">
                    Severidad
                  </Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Menor</SelectItem>
                      <SelectItem value="major">Mayor</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="blocker">Bloqueante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-card-foreground">
                    Asignar a
                  </Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {projectMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stepsToReproduce" className="text-card-foreground">
                  Pasos para Reproducir
                </Label>
                <Textarea
                  id="stepsToReproduce"
                  placeholder="1. Ir a la página de login&#10;2. Ingresar email válido&#10;3. Ingresar contraseña válida&#10;4. Hacer clic en 'Iniciar Sesión'"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[100px]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expectedBehavior" className="text-card-foreground">
                    Comportamiento Esperado
                  </Label>
                  <Textarea
                    id="expectedBehavior"
                    placeholder="El usuario debería ser redirigido al dashboard..."
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    className="bg-input border-border text-foreground min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualBehavior" className="text-card-foreground">
                    Comportamiento Actual
                  </Label>
                  <Textarea
                    id="actualBehavior"
                    placeholder="Se muestra un mensaje de error..."
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    className="bg-input border-border text-foreground min-h-[80px]"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando..." : "Reportar Bug"}
                </Button>
                <Button asChild variant="outline" className="flex-1 border-border bg-transparent">
                  <Link href={`/bugs${selectedProject ? `?project=${selectedProject}` : ""}`}>Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
