"use client";

import { useState, useEffect, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

type Project = { id: string; name: string };
type Member = { id: string; full_name: string; email?: string };
type TestCase = { id: string; title: string };

export default function NewBugPage() {
  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [priority, setPriority] = useState("medium");
  const [severity, setSeverity] = useState("minor");
  const [assignedTo, setAssignedTo] = useState("unassigned");
  const [testCaseId, setTestCaseId] = useState("");
  const [bugNumber, setBugNumber] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // lists + selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFromUrl = searchParams.get("project");
  const testCaseFromUrl = searchParams.get("testCase");

  // Load user's projects
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProjects } = await supabase
        .from("project_members")
        .select("project_id, projects ( id, name )")
        .eq("user_id", user.id);

      const projectsList: Project[] = (userProjects ?? []).flatMap((up: any) =>
        up?.projects
          ? [{ id: String(up.projects.id), name: String(up.projects.name) }]
          : []
      );

      setProjects(projectsList);

      const preselected =
        (projectFromUrl &&
          projectsList.find((p) => p.id === projectFromUrl)?.id) ||
        projectsList[0]?.id ||
        "";

      setSelectedProject(preselected);

      if (testCaseFromUrl) setTestCaseId(testCaseFromUrl);
    };

    loadData();
  }, [projectFromUrl, testCaseFromUrl]);

  // Load members, test cases and next bug number
  useEffect(() => {
    if (!selectedProject) {
      setProjectMembers([]);
      setTestCases([]);
      setBugNumber(null);
      return;
    }

    const loadProjectData = async () => {
      const supabase = createClient();

      // miembros
      const { data: members } = await supabase
        .from("project_members")
        .select("users ( id, full_name, email )")
        .eq("project_id", selectedProject);

      const membersList: Member[] = (members ?? []).flatMap((m: any) =>
        m?.users
          ? [
              {
                id: String(m.users.id),
                full_name: String(m.users.full_name),
                email: m.users.email ? String(m.users.email) : undefined,
              },
            ]
          : []
      );
      setProjectMembers(membersList);
      // test cases
      const { data: cases } = await supabase
        .from("test_cases")
        .select("id, title")
        .eq("project_id", selectedProject);

      const testCasesList: TestCase[] = (cases ?? []).map((c: any) => ({
        id: String(c.id),
        title: String(c.title),
      }));

      setTestCases(testCasesList);

      // numero de bug
      const { data: lastBug } = await supabase
        .from("bugs")
        .select("bug_number")
        .eq("project_id", selectedProject)
        .order("bug_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      setBugNumber(lastBug ? lastBug.bug_number + 1 : 1);
    };

    loadProjectData();
  }, [selectedProject]);

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");
      if (!selectedProject) throw new Error("Debe seleccionar un proyecto");
      if (!bugNumber) throw new Error("No se pudo generar el número de bug");

      const test_case_value =
        testCaseId === "none" || testCaseId === "" ? null : testCaseId;
      const assigned_value = assignedTo === "unassigned" ? null : assignedTo;

      const { data: bug, error: bugError } = await supabase
        .from("bugs")
        .insert({
          project_id: selectedProject,
          bug_number: bugNumber, // 🚀 número consecutivo
          test_case_id: test_case_value,
          title,
          description,
          steps_to_reproduce: stepsToReproduce,
          expected_behavior: expectedBehavior,
          actual_behavior: actualBehavior,
          priority,
          severity,
          reported_by: user.id,
          assigned_to: assigned_value,
        })
        .select()
        .single();

      if (bugError) throw bugError;

      router.push(`/bugs/${bug.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el bug");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">
              Reportar Bug
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea un nuevo reporte de bug
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent"
          >
            <Link
              href={`/bugs${
                selectedProject ? `?project=${selectedProject}` : ""
              }`}
            >
              Cancelar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Información del Bug
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Completa los datos para reportar un nuevo bug
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Proyecto - Caso de prueba - Número de bug */}
              <div className="grid gap-6 grid-cols-3">
                {/* Proyecto */}
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-card-foreground">
                    Proyecto *
                  </Label>
                  <Select
                    value={selectedProject}
                    onValueChange={(v) => setSelectedProject(v)}
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

                {/* Caso de prueba */}
                <div className="space-y-2">
                  <Label htmlFor="testCase" className="text-card-foreground">
                    Caso de Prueba (Opcional)
                  </Label>
                  <Select
                    value={testCaseId}
                    onValueChange={(v) => setTestCaseId(v)}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecciona un caso de prueba" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {testCases.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">
                          No hay casos de prueba en este proyecto
                        </div>
                      ) : (
                        testCases.map((testCase) => (
                          <SelectItem key={testCase.id} value={testCase.id}>
                            {testCase.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Número de bug */}
                <div className="space-y-2">
                  <Label htmlFor="bugNumber" className="text-card-foreground">
                    Número de Bug
                  </Label>
                  <Input
                    id="bugNumber"
                    type="text"
                    value={bugNumber ?? ""}
                    readOnly
                    className="bg-muted text-foreground"
                    disabled
                  />
                </div>
              </div>

              {/* Título */}
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

              {/* Descripción */}
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

              {/* Prioridad - Severidad - Asignar a */}
              <div className="grid gap-6 grid-cols-3">
                {/* Prioridad */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-card-foreground">
                    Prioridad
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v)}
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

                {/* Severidad */}
                <div className="space-y-2">
                  <Label htmlFor="severity" className="text-card-foreground">
                    Severidad
                  </Label>
                  <Select
                    value={severity}
                    onValueChange={(v) => setSeverity(v)}
                  >
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

                {/* Asignar a */}
                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-card-foreground">
                    Asignar a
                  </Label>
                  <Select
                    value={assignedTo}
                    onValueChange={(v) => setAssignedTo(v)}
                  >
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

              {/* Pasos para reproducir */}
              <div className="space-y-2">
                <Label
                  htmlFor="stepsToReproduce"
                  className="text-card-foreground"
                >
                  Pasos para Reproducir
                </Label>
                <Textarea
                  id="stepsToReproduce"
                  placeholder={
                    "1. Ir a la página de login\n2. Ingresar email válido\n3. Ingresar contraseña válida\n4. Hacer clic en 'Iniciar Sesión'"
                  }
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[100px]"
                />
              </div>

              {/* Comportamiento esperado y actual */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="expectedBehavior"
                    className="text-card-foreground"
                  >
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
                  <Label
                    htmlFor="actualBehavior"
                    className="text-card-foreground"
                  >
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

              {/* Botones */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando..." : "Reportar Bug"}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-border bg-transparent"
                >
                  <Link
                    href={`/bugs${
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
