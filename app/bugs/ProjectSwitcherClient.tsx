// app/bugs/ProjectSwitcherClient.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type React from "react";

type Project = { id: string; name: string };

export default function ProjectSwitcherClient({
  projects,
  selectedProjectId,
}: {
  projects: Project[];
  selectedProjectId: string;
}) {
  const router = useRouter();

  const handleChange = (value: string) => {
    if (!value) return;
    // Usamos router.push para mantener SPA behavior
    router.push(`/bugs?project=${encodeURIComponent(value)}`);
  };

  return (
    <div>
      <Select value={selectedProjectId} onValueChange={handleChange}>
        <SelectTrigger className="w-64 bg-input border-border text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
