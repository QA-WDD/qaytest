import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">Bug Tracker</h1>
          </div>
          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-card-foreground">Verifica tu Email</CardTitle>
              <CardDescription className="text-muted-foreground">
                Te hemos enviado un enlace de verificación a tu correo electrónico.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu
                  cuenta.
                </p>
                <div className="pt-4">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/auth/login">Volver al Login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
