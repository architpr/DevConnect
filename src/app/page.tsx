import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowRight, Code, Users, Trophy } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    DevConnect
                </div>
                <div className="space-x-4">
                    <Link href="/login">
                        <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link href="/signup">
                        <Button>Get Started</Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 py-20 text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                    Build the <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Dream Team</span><br />
                    for your next Hackathon
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                    Connect your GitHub, LeetCode, and GFG profiles. Showcase your stats. Find teammates who complement your skills.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/signup">
                        <Button size="lg" className="h-14 px-8 text-lg">
                            Start Connecting <ArrowRight className="ml-2" />
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                            Browse Teams
                        </Button>
                    </Link>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Find Teammates</h3>
                        <p className="text-gray-400">
                            Post your requirements and find developers with the exact skills you need for your project.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <Code className="h-6 w-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Showcase Stats</h3>
                        <p className="text-gray-400">
                            Automatically pull stats from LeetCode, GitHub, and GFG to prove your expertise.
                        </p>
                    </div>
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="h-12 w-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                            <Trophy className="h-6 w-6 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Win Hackathons</h3>
                        <p className="text-gray-400">
                            Discover upcoming hackathons and build a balanced team to maximize your chances of winning.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
