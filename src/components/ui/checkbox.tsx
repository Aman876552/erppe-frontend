import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function Checkbox({ checked, onChange, label, className, disabled, id, ...props }: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex items-center justify-center">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <div
          onClick={() => !disabled && onChange(!checked)}
          className={cn(
            "h-5 w-5 rounded-md border border-input bg-background/50 flex items-center justify-center transition-all duration-150 cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
            checked && "bg-primary text-primary-foreground border-primary",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </div>
      </div>
      {label && (
        <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  )
}
