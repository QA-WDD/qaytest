"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface ProjectMember {
  id: string
  role: string
  joined_at: string
  users: {
    id: string
    full_name: string
    email: string
    user_role: string
  }
}

interface ProjectMembersSectionProps {
  projectId: string
  members: ProjectMember[]
  canManage: boolean
  currentUserRole: string
}

export function ProjectMembersSection({ projectId, members, canManage, currentUserRole }: ProjectMembersSectionProps) {
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("tester")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Find user by email
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", newMemberEmail)
        .single()

      if (userError || !user) {
        throw new Error("Usuario no encontrado")
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        throw new Error("El usuario ya es miembro del proyecto")
      }

      // Add member
      const { error: memberError } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: user.id,
        role: newMemberRole,
      })

      if (memberError) throw memberError

      setNewMemberEmail("")
      setNewMemberRole("tester")
      setIsAddingMember(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al agregar miembro")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("project_members").delete().eq("id", memberId)
      if (error) throw error
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al remover miembro")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "lead":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "tester":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "lead":
        return "Lead"
      case "tester":
        return "Tester"
      default:
        return role
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-card-foreground">Miembros del Proyecto</CardTitle>
            <CardDescription className="text-muted-foreground">{members.length} miembros</CardDescription>
          </div>
          {canManage && (
            <Button
              onClick={() => setIsAddingMember(!isAddingMember)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isAddingMember ? "Cancelar" : "Agregar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingMember && (
          <form onSubmit={handleAddMember} className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="memberEmail" className="text-card-foreground">
                Email del Usuario
              </Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberRole" className="text-card-foreground">
                Rol
              </Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tester">Tester</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  {currentUserRole === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Agregando..." : "Agregar Miembro"}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-card-foreground">{member.users.full_name}</span>
                  <Badge className={getRoleBadgeColor(member.role)}>{getRoleText(member.role)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{member.users.email}</p>
                <p className="text-xs text-muted-foreground">
                  Unido: {new Date(member.joined_at).toLocaleDateString("es-ES")}
                </p>
              </div>
              {canManage && member.role !== "admin" && (
                <Button
                  onClick={() => handleRemoveMember(member.id)}
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
