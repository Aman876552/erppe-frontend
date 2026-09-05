import React from "react"
import { ShieldCheck, Lock, CheckCircle } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left visual branding column (desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-black text-xl shadow-lg shadow-blue-500/30">
            E
          </div>
          <span className="text-xl font-bold tracking-tight">ERP Enterprise</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Zero-Trust Enterprise Security</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Streamlined Management for Modern Enterprises.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Manage your users, roles, granular RBAC permissions, audit logs, and core business operations with ultimate speed and security.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "Granular Role-Based Access Control (RBAC)",
              "Multi-tenant isolation & security audit logging",
              "Real-time operations & unified core kernel",
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>© 2026 ERP Enterprise Inc. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> 256-bit SSL Encrypted
          </span>
        </div>
      </div>

      {/* Right form input column */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>
    </div>
  )
}
