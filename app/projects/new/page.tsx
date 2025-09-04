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
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function NewProjectPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Try to load profile; if missing, create it from auth metadata
        let { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (!userProfile) {
          const meta = user.user_metadata || {}
          const fullName = meta.full_name || user.email
          const rawRoleInput = (meta.role || meta.Role || meta.ROLE || "") as string
          const normalizedInput = rawRoleInput.toString().trim().toLowerCase()
          const role =
            ["admin", "padmin", "superadmin", "owner", "administrator"].includes(normalizedInput)
              ? "admin"
              : ["lead", "leader", "manager", "pm"].includes(normalizedInput)
              ? "lead"
              : "tester"

          await supabase
            .from("users")
            .upsert({ id: user.id, email: user.email, full_name: fullName, role }, { onConflict: "id" })
          const { data: createdProfile } = await supabase.from("users").select("role").eq("id", user.id).single()
          userProfile = createdProfile as typeof userProfile
        }

        const effectiveRole = (userProfile?.role as string | undefined)?.toLowerCase()
        if (effectiveRole !== "admin" && effectiveRole !== "lead") {
          setForbidden(true)
          return
        }

        setUserRole(effectiveRole || null)
      } else {
        router.push("/auth/login")
      }
    }

    checkUserRole()
  }, [router])

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

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name,
          description,
          status,
          created_by: user.id,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Add creator as project member with lead role
      const { error: memberError } = await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.id,
        role: userRole === "admin" ? "admin" : "lead",
      })

      if (memberError) throw memberError

      router.push(`/projects/${project.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear el proyecto")
    } finally {
      setIsLoading(false)
    }
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Crear Proyecto</h1>
              <p className="text-sm text-muted-foreground">No tienes permisos para crear proyectos</p>
            </div>
            <Button asChild variant="outline" className="border-border bg-transparent">
              <Link href="/projects">Volver</Link>
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Acceso restringido</CardTitle>
              <CardDescription className="text-muted-foreground">
                Debes ser administrador o líder para crear proyectos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/projects">Ir a Proyectos</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (userRole === null) {
    return <div>Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Crear Proyecto</h1>
            <p className="text-sm text-muted-foreground">Crea un nuevo proyecto de testing</p>
          </div>
          <Button asChild variant="outline" className="border-border bg-transparent">
            <Link href="/projects">Cancelar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Información del Proyecto</CardTitle>
            <CardDescription className="text-muted-foreground">
              Completa los datos para crear un nuevo proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre del Proyecto *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej: Sistema de Facturación v2.0"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-card-foreground">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el proyecto y sus objetivos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-card-foreground">
                  Estado Inicial
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
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
                  {isLoading ? "Creando..." : "Crear Proyecto"}
                </Button>
                <Button asChild variant="outline" className="flex-1 border-border bg-transparent">
                  <Link href="/projects">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
