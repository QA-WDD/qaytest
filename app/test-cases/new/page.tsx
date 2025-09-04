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

export default function NewTestCasePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [preconditions, setPreconditions] = useState("")
  const [steps, setSteps] = useState("")
  const [expectedResult, setExpectedResult] = useState("")
  const [status, setStatus] = useState("draft")
  const [priority, setPriority] = useState("medium")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const projectFromUrl = searchParams.get("project")

  useEffect(() => {
    const loadProjects = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
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
      }
    }

    loadProjects()
  }, [projectFromUrl])

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

      const { data: testCase, error: testCaseError } = await supabase
        .from("test_cases")
        .insert({
          project_id: selectedProject,
          title,
          description,
          preconditions,
          steps,
          expected_result: expectedResult,
          status,
          priority,
          created_by: user.id,
        })
        .select()
        .single()

      if (testCaseError) throw testCaseError

      router.push(`/test-cases/${testCase.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear el caso de prueba")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Crear Caso de Prueba</h1>
            <p className="text-sm text-muted-foreground">Crea un nuevo caso de prueba</p>
          </div>
          <Button asChild variant="outline" className="border-border bg-transparent">
            <Link href={`/test-cases${selectedProject ? `?project=${selectedProject}` : ""}`}>Cancelar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Información del Caso de Prueba</CardTitle>
            <CardDescription className="text-muted-foreground">
              Completa los datos para crear un nuevo caso de prueba
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-card-foreground">
                  Título *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ej: Verificar login con credenciales válidas"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="steps" className="text-card-foreground">
                  Pasos a Seguir *
                </Label>
                <Textarea
                  id="steps"
                  placeholder="1. Abrir la página de login&#10;2. Ingresar email válido&#10;3. Ingresar contraseña válida&#10;4. Hacer clic en 'Iniciar Sesión'"
                  required
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedResult" className="text-card-foreground">
                  Resultado Esperado *
                </Label>
                <Textarea
                  id="expectedResult"
                  placeholder="El usuario debe ser redirigido al dashboard principal..."
                  required
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-card-foreground">
                  Estado
                </Label>
                <Select value={status} onValueChange={setStatus}>
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
                <Button asChild variant="outline" className="flex-1 border-border bg-transparent">
                  <Link href={`/test-cases${selectedProject ? `?project=${selectedProject}` : ""}`}>Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
