import * as React from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", isLoading, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

        const variants = {
            primary: "bg-yellow-400 text-black hover:bg-yellow-300 border border-yellow-500/50 shadow-md shadow-yellow-500/30 dark:bg-yellow-300 dark:hover:bg-yellow-200 dark:text-black dark:border-yellow-400/60 dark:shadow-lg dark:shadow-yellow-500/25",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "border border-input hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
        }

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-10 py-2 px-4",
            lg: "h-11 px-8 text-lg",
        }

        const variantStyles = variants[variant]
        const sizeStyles = sizes[size]

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"
