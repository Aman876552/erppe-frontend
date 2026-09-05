"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/modules/core/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage("Please enter both email address and password.")
      return
    }

    setIsLoading(true)
    const res = await login({ email, password, rememberMe })
    setIsLoading(false)

    if (res.success) {
      router.push("/")
    } else {
      setErrorMessage(res.message || "Invalid credentials provided. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
        <p className="text-sm text-muted-foreground">
          Enter your enterprise credentials to access the portal
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Email Address</label>
          <Input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onChange={setRememberMe}
            label="Keep me signed in for 30 days"
          />
        </div>

        <Button type="submit" variant="default" size="lg" className="w-full gap-2 mt-2" disabled={isLoading}>
          {isLoading ? (
            "Authenticating..."
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign In to Portal
            </>
          )}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground text-center">
        <p className="font-semibold text-foreground">Demo Credentials Preset:</p>
        <p className="mt-1 font-mono text-[11px]">Email: alexander.wright@enterprise.com</p>
        <p className="font-mono text-[11px]">Role: Super Administrator</p>
      </div>
    </div>
  )
}
