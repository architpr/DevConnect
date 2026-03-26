"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Moon,
    Sun,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Notifications", href: "/notifications", icon: Bell },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()
    const supabase = createClient()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(true)
    const [notificationCount, setNotificationCount] = useState(0)

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains("dark"))
    }, [])

    useEffect(() => {
        const fetchNotificationCount = async () => {
            if (!user) return
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            if (!error && count !== null) {
                setNotificationCount(count)
            }
        }

        fetchNotificationCount()

        const channel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user?.id}`
                },
                () => {
                    fetchNotificationCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase])

    const toggleTheme = () => {
        const nextModeIsDark = !isDarkMode
        document.documentElement.classList.toggle("dark", nextModeIsDark)
        localStorage.setItem("theme", nextModeIsDark ? "dark" : "light")
        setIsDarkMode(nextModeIsDark)
    }

    return (
        <aside className={`flex h-full flex-col border-r border-black/10 bg-[#fffdf7] text-zinc-950 transition-all duration-300 dark:border-white/10 dark:bg-black dark:text-white ${isCollapsed ? "w-24" : "w-[296px]"}`}>
            <div className="px-4 py-3">
                <div className={`flex ${isCollapsed ? "flex-col items-center gap-4" : "items-center justify-between gap-3"}`}>
                    <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : "gap-4"}`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffdd00] text-sm font-extrabold text-black shadow-[0_0_0_1px_rgba(255,221,0,0.15)]">
                            D
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-[1rem] font-semibold leading-none tracking-[-0.03em] text-zinc-950 dark:text-white">
                                    DevConnect
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-500 transition-colors hover:border-black/20 hover:bg-black/[0.04] hover:text-zinc-950 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-[#a8a8a8] dark:hover:border-white/20 dark:hover:bg-white/[0.04] dark:hover:text-white ${isCollapsed ? "" : "shrink-0"}`}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <nav className="flex-1 px-4 pt-4 space-y-3">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href === '/research' && pathname.startsWith('/research'))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={`group flex items-center rounded-2xl px-4 py-3.5 transition-all duration-200 ${isCollapsed ? "justify-center" : "gap-3"} ${isActive
                                ? "bg-[#ffdd00] text-black"
                                : "text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-950 dark:text-[#9f9f9f] dark:hover:bg-white/[0.04] dark:hover:text-white"
                                }`}
                        >
                            <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-black" : "text-zinc-500 group-hover:text-zinc-950 dark:text-[#b7b7b7] dark:group-hover:text-white"}`} />
                            {!isCollapsed && (
                                <>
                                    <span className="text-[0.82rem] font-medium">{item.name}</span>
                                    {item.href === "/notifications" && notificationCount > 0 && (
                                        <span className="ml-auto inline-flex min-w-7 items-center justify-center rounded-full bg-[#2f2a00] px-2 py-1 text-xs font-semibold text-[#ffdd00]">
                                            {notificationCount}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="space-y-2 border-t border-white/10 px-4 py-6">
                <button
                    type="button"
                    onClick={toggleTheme}
                    title={isCollapsed ? (isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : undefined}
                    className={`flex w-full items-center rounded-xl px-4 py-3 text-zinc-600 transition-colors hover:bg-black/[0.04] hover:text-zinc-950 dark:text-[#c9c9c9] dark:hover:bg-white/[0.04] dark:hover:text-white ${isCollapsed ? "justify-center" : "gap-3"}`}
                >
                    {isDarkMode ? (
                        <Moon className="h-5 w-5 shrink-0" />
                    ) : (
                        <Sun className="h-5 w-5 shrink-0" />
                    )}
                    {!isCollapsed && <span className="text-[0.82rem] font-medium">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
                </button>
                <button
                    onClick={signOut}
                    title={isCollapsed ? "Sign Out" : undefined}
                    className={`flex w-full items-center rounded-xl px-4 py-3 text-zinc-700 transition-colors hover:bg-black/[0.04] hover:text-zinc-950 dark:text-[#d7d7d7] dark:hover:bg-white/[0.04] dark:hover:text-white ${isCollapsed ? "justify-center" : "gap-3"}`}
                >
                    {isCollapsed ? (
                        <LogOut className="h-5 w-5 shrink-0" />
                    ) : (
                        <>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffdd00] text-xs font-bold text-black">
                                N
                            </div>
                            <span className="text-[0.82rem] font-medium">Sign Out</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
