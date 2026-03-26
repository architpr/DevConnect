import { Sidebar } from "@/components/dashboard/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="theme-animate flex h-screen overflow-hidden bg-[#f7f4ea] text-zinc-950 dark:bg-[#020202] dark:text-white">
            <div className="relative z-10 flex w-full">
                <Sidebar />
                <main className="flex-1 overflow-auto border border-black/10 border-y-0 border-r-0 bg-[#f7f4ea] px-6 py-8 dark:border-white/10 dark:bg-[#020202] md:px-10">
                    <div className="mx-auto max-w-[1180px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
