"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface BugStatusUpdateProps {
  bugId: string
  currentStatus: string
  currentPriority: string
  currentSeverity: string
  currentAssignedTo: string | null
  projectId: string
}

export function BugStatusUpdate({
  bugId,
  currentStatus,
  currentPriority,
  currentSeverity,
  currentAssignedTo,
  projectId,
}: BugStatusUpdateProps) {
  const [status, setStatus] = useState(currentStatus)
  const [priority, setPriority] = useState(currentPriority)
  const [severity, setSeverity] = useState(currentSeverity)
  const [assignedTo, setAssignedTo] = useState(currentAssignedTo || "unassigned")
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadProjectMembers = async () => {
      const supabase = createClient()

      const { data: members } = await supabase
        .from("project_members")
        .select(`
          users (
            id,
            full_name,
            email
          )
        `)
        .eq("project_id", projectId)

      setProjectMembers(members?.map((m) => m.users).filter(Boolean) || [])
    }

    loadProjectMembers()
  }, [projectId])

  const handleUpdate = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      // Track changes for history
      const changes = []
      if (status !== currentStatus) {
        changes.push({ field_name: "Estado", old_value: currentStatus, new_value: status })
      }
      if (priority !== currentPriority) {
        changes.push({ field_name: "Prioridad", old_value: currentPriority, new_value: priority })
      }
      if (severity !== currentSeverity) {
        changes.push({ field_name: "Severidad", old_value: currentSeverity, new_value: severity })
      }
      if (assignedTo !== (currentAssignedTo || "unassigned")) {
        changes.push({
          field_name: "Asignado a",
          old_value: currentAssignedTo || "Sin asignar",
          new_value: assignedTo || "Sin asignar",
        })
      }

      // Update bug
      const updateData: any = {
        status,
        priority,
        severity,
        assigned_to: assignedTo || null,
      }

      if (status === "resolved" && currentStatus !== "resolved") {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase.from("bugs").update(updateData).eq("id", bugId)

      if (updateError) throw updateError

      // Add history entries
      if (changes.length > 0) {
        const historyEntries = changes.map((change) => ({
          bug_id: bugId,
          field_name: change.field_name,
          old_value: change.old_value,
          new_value: change.new_value,
          changed_by: user.id,
        }))

        const { error: historyError } = await supabase.from("bug_history").insert(historyEntries)

        if (historyError) throw historyError
      }

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al actualizar el bug")
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges =
    status !== currentStatus ||
    priority !== currentPriority ||
    severity !== currentSeverity ||
    assignedTo !== (currentAssignedTo || "unassigned")

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Actualizar Bug</CardTitle>
        <CardDescription className="text-muted-foreground">Cambiar estado, prioridad y asignación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-card-foreground">Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abierto</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="resolved">Resuelto</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
              <SelectItem value="reopened">Reabierto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-card-foreground">Prioridad</Label>
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
          <Label className="text-card-foreground">Severidad</Label>
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
          <Label className="text-card-foreground">Asignar a</Label>
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleUpdate}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? "Actualizando..." : "Actualizar Bug"}
        </Button>
      </CardContent>
    </Card>
  )
}
