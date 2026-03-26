import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={`flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white transition-all duration-200 ${icon ? 'pl-10' : ''} ${className}`}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            {icon}
                        </div>
                    )}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        )
    }
)
Input.displayName = "Input"
