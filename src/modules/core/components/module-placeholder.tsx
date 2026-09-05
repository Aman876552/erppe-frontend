import React from "react"
import Link from "next/link"
import { PageHeader } from "./page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ERP_MODULES } from "@/config/modules"
import { Clock, Lock, ArrowLeft, Layers, ShieldCheck } from "lucide-react"

interface ModulePlaceholderProps {
  moduleKey: string
  subPageTitle?: string
}

export function ModulePlaceholder({ moduleKey, subPageTitle }: ModulePlaceholderProps) {
  const meta = ERP_MODULES[moduleKey] || {
    name: subPageTitle || "ERP Module",
    description: "Enterprise domain module integration layer.",
    status: "coming_soon",
  }

  const title = subPageTitle ? `${meta.name} - ${subPageTitle}` : meta.name

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={meta.description}
        badge={
          meta.status === "active" ? (
            <Badge variant="success">Active</Badge>
          ) : meta.status === "inactive" ? (
            <Badge variant="secondary">Module Inactive</Badge>
          ) : (
            <Badge variant="warning">Under Active Setup</Badge>
          )
        }
        actions={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        }
      />

      <Card className="border-dashed border-border bg-card/60">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Clock className="h-8 w-8" />
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="text-xl font-bold text-foreground">Module Setup In Progress</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As per current workspace configuration, the <span className="font-semibold text-foreground">{meta.name}</span> module is queued. The User Management & Security Core kernel is active.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-left max-w-xs space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> RBAC Security Hook
              </span>
              <p className="text-[11px] text-muted-foreground">
                Permission keys for {moduleKey}.* are configured in the permissions dictionary.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-left max-w-xs space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Layers className="h-3.5 w-3.5 text-primary" /> App Router Target
              </span>
              <p className="text-[11px] text-muted-foreground">
                File route hierarchy and navigation links are registered.
              </p>
            </div>
          </div>

          <Button asChild variant="default" className="mt-4 gap-2">
            <Link href="/core/users">Explore User & Security Module</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
