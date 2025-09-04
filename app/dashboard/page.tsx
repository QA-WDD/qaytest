import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  // Get user's projects count
  const { count: projectsCount } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", data.user.id)

  // Get recent bugs count
  const { count: bugsCount } = await supabase
    .from("bugs")
    .select("*", { count: "exact", head: true })
    .eq("reported_by", data.user.id)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Bug Tracker</h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestión de Bugs y Casos de Prueba</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Bienvenido, {userProfile?.full_name || data.user.email}
            </span>
            <form action={handleSignOut}>
              <Button
                variant="outline"
                type="submit"
                className="border-border text-card-foreground hover:bg-muted bg-transparent"
              >
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Proyectos</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gestiona tus proyectos de testing ({projectsCount || 0} proyectos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/projects">Ver Proyectos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Casos de Prueba</CardTitle>
              <CardDescription className="text-muted-foreground">Crea y ejecuta casos de prueba</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link href="/test-cases">Ver Casos de Prueba</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Bugs</CardTitle>
              <CardDescription className="text-muted-foreground">
                Reporta y rastrea bugs ({bugsCount || 0} reportados)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/bugs">Ver Bugs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {(userProfile?.role === "admin" || userProfile?.role === "lead") && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Acciones Rápidas</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button asChild variant="outline" className="h-auto p-4 border-border bg-transparent">
                <Link href="/projects/new" className="flex flex-col items-center gap-2">
                  <span className="text-lg">+</span>
                  <span>Crear Proyecto</span>
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-card-foreground">Email:</span>{" "}
                  <span className="text-muted-foreground">{data.user.email}</span>
                </p>
                <p>
                  <span className="font-medium text-card-foreground">Nombre:</span>{" "}
                  <span className="text-muted-foreground">{userProfile?.full_name || "No especificado"}</span>
                </p>
                <p>
                  <span className="font-medium text-card-foreground">Rol:</span>{" "}
                  <span className="text-muted-foreground">{userProfile?.role || "tester"}</span>
                </p>
                <p>
                  <span className="font-medium text-card-foreground">Estado:</span>{" "}
                  <span className="text-muted-foreground">{userProfile?.is_active ? "Activo" : "Inactivo"}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
