"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, onCheckedChange, checked, defaultChecked, ...props }, ref) => {
        const [isChecked, setIsChecked] = React.useState(defaultChecked || checked || false)

        React.useEffect(() => {
            if (checked !== undefined) {
                setIsChecked(checked)
            }
        }, [checked])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newChecked = e.target.checked
            setIsChecked(newChecked)
            onCheckedChange?.(newChecked)
        }

        return (
            <label
                className={cn(
                    "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors",
                    isChecked ? "bg-indigo-600" : "bg-gray-600",
                    className
                )}
            >
                <input
                    type="checkbox"
                    className="sr-only"
                    ref={ref}
                    checked={isChecked}
                    onChange={handleChange}
                    {...props}
                />
                <span
                    className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                        isChecked ? "translate-x-5" : "translate-x-0.5"
                    )}
                />
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
