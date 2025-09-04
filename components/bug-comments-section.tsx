"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface BugComment {
  id: string
  comment: string
  created_at: string
  users: {
    full_name: string
  }
}

interface BugCommentsSectionProps {
  bugId: string
  comments: BugComment[]
}

export function BugCommentsSection({ bugId, comments }: BugCommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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

      const { error: commentError } = await supabase.from("bug_comments").insert({
        bug_id: bugId,
        comment: newComment,
        created_by: user.id,
      })

      if (commentError) throw commentError

      setNewComment("")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al agregar comentario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Comentarios</CardTitle>
        <CardDescription className="text-muted-foreground">
          Conversación sobre este bug ({comments.length} comentarios)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Comments */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-card-foreground">{comment.users?.full_name || "Desconocido"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString("es-ES")}
                  </span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No hay comentarios aún</p>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-border">
          <Textarea
            placeholder="Agregar un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-input border-border text-foreground min-h-[80px]"
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading || !newComment.trim()}
          >
            {isLoading ? "Agregando..." : "Agregar Comentario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
