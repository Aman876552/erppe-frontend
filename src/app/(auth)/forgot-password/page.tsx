"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we will send you a password recovery link
        </p>
      </div>

      {isSubmitted ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Recovery Email Sent</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We have dispatched password reset instructions to <span className="font-semibold text-foreground">{email}</span>. Check your inbox and follow the steps provided.
          </p>
          <Button asChild variant="outline" className="mt-4 gap-2 w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Work Email Address</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <Button type="submit" variant="default" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending Link..." : "Send Reset Link"}
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
