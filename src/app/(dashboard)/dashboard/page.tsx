import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Calendar, Home, Link as LinkIcon, Microscope, User } from 'lucide-react'

const modules = [
    { name: 'MyStats', href: '/profile', icon: User, description: 'Track your coding, ATS, and research profile.' },
    { name: 'BuildBoard', href: '/feed', icon: Home, description: 'Find hackathon team opportunities.' },
    { name: 'ResearchHub', href: '/research', icon: Microscope, description: 'Discover and join research projects.' },
    { name: 'LinkedPlatforms', href: '/networks', icon: LinkIcon, description: 'Connect GitHub, LeetCode, and GFG accounts.' },
    { name: 'ContestHub', href: '/platforms', icon: Calendar, description: 'Browse upcoming hackathons and contests.' },
]

export default function DashboardPage() {
    const topRowModules = modules.slice(0, 3)
    const bottomRowModules = modules.slice(3)

    const renderModuleCard = (item: typeof modules[number]) => {
        const Icon = item.icon

        return (
            <Card
                key={item.href}
                className="w-full rounded-2xl border border-black/10 bg-white/80 shadow-none transition-colors hover:border-black/20 dark:border-white/10 dark:bg-[#070707] dark:hover:border-white/20"
            >
                <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1a8] text-[#8a6a00] dark:bg-[#2b2900] dark:text-[#ffdd00]">
                            <Icon className="h-7 w-7" />
                        </div>
                    </div>
                    <CardTitle className="pt-8 text-[1.2rem] font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">
                        {item.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-[228px] flex-col space-y-8">
                    <p className="max-w-[24ch] text-[0.78rem] leading-7 text-zinc-600 dark:text-[#7f828f]">{item.description}</p>
                    <Link href={item.href}>
                        <Button className="mt-auto h-14 w-full rounded-xl border-0 bg-[#ffdd00] text-[0.9rem] font-medium text-black shadow-none hover:bg-[#ffe74d]">
                            <span>Open</span>
                            <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    const renderCompactCard = (item: typeof modules[number]) => {
        const Icon = item.icon

        return (
            <Card
                key={item.href}
                className="w-full rounded-2xl border border-black/10 bg-white/80 shadow-none transition-colors hover:border-black/20 dark:border-white/10 dark:bg-[#070707] dark:hover:border-white/20"
            >
                <CardContent className="flex min-h-[140px] items-center justify-between gap-5 p-7">
                    <div className="flex min-w-0 items-center gap-5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff1a8] text-[#8a6a00] dark:bg-[#2b2900] dark:text-[#ffdd00]">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[1.02rem] font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">{item.name}</h3>
                            <p className="mt-1 max-w-[34ch] text-[0.74rem] leading-6 text-zinc-600 dark:text-[#7f828f]">{item.description}</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-5">
                        <Link href={item.href}>
                            <Button className="h-11 rounded-xl border-0 bg-[#ffdd00] px-7 text-[0.88rem] font-medium text-black shadow-none hover:bg-[#ffe74d]">
                                Open
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-[2.2rem] font-semibold tracking-[-0.06em] text-zinc-950 dark:text-white">
                    Dashboard
                </h1>
                <p className="mt-3 text-[0.84rem] text-zinc-600 dark:text-[#7f828f]">Your central workspace for team and research collaboration.</p>
            </div>

            <div className="space-y-8">
                <div className="grid gap-5 xl:grid-cols-3">
                    {topRowModules.map(renderModuleCard)}
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    {bottomRowModules.map(renderCompactCard)}
                </div>
            </div>
        </div>
    )
}
