import * as React from "react"
import { cn } from "@/lib/utils"

export interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  destructive?: boolean
  disabled?: boolean
  divider?: boolean
}

export interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: "left" | "right"
}

export function DropdownMenu({ trigger, items, align = "right" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in-80 zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.divider && <div className="my-1 h-px bg-border" />}
              <button
                disabled={item.disabled}
                onClick={() => {
                  if (item.onClick) item.onClick()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer text-left",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  item.disabled && "pointer-events-none opacity-50"
                )}
              >
                {item.icon && <span className="h-4 w-4 text-muted-foreground">{item.icon}</span>}
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
