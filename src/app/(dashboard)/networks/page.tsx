"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Github, Code, Terminal, CheckCircle } from "lucide-react"

type LinkedAccount = {
    id: string
    platform: string
    platform_username: string
}

export default function NetworksPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [accounts, setAccounts] = useState<LinkedAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)

    // Form inputs
    const [githubUser, setGithubUser] = useState("")
    const [leetcodeUser, setLeetcodeUser] = useState("")
    const [gfgUser, setGfgUser] = useState("")

    const fetchAccounts = useCallback(async () => {
        if (!user) return
        const { data } = await supabase
            .from('linked_accounts')
            .select('*')
            .eq('user_id', user.id)

        if (data) setAccounts(data)
        setLoading(false)
    }, [user, supabase])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    const connectAccount = async (platform: string, username: string) => {
        if (!user || !username) return
        setConnecting(platform)

        try {
            // In a real app, verify the username exists via API here before saving

            const { error } = await supabase
                .from('linked_accounts')
                .upsert({
                    user_id: user.id,
                    platform,
                    platform_username: username,
                })

            if (error) throw error

            await fetchAccounts()
            alert(`Connected ${platform} successfully!`)

            // Clear input
            if (platform === 'github') setGithubUser("")
            if (platform === 'leetcode') setLeetcodeUser("")
            if (platform === 'geeksforgeeks') setGfgUser("")

        } catch (error: unknown) {
            alert(`Error linking account: ${(error as Error).message}`)
        } finally {
            setConnecting(null)
        }
    }

    const isConnected = (platform: string) => accounts.some(a => a.platform === platform)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    LinkedPlatforms
                </h1>
                <p className="text-gray-400 mt-2">Link your coding profiles to showcase your stats.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* GitHub */}
                <Card className="items-center">
                    <CardHeader className="text-center">
                        <Github className="mx-auto h-12 w-12 mb-2 text-white" />
                        <CardTitle>GitHub</CardTitle>
                        <CardDescription>Connect repositories and contribution graph</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isConnected('github') ? (
                            <div className="flex items-center justify-center text-green-400 bg-green-400/10 p-2 rounded">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Connected as {accounts.find(a => a.platform === 'github')?.platform_username}
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="GitHub Username"
                                    value={githubUser}
                                    onChange={(e) => setGithubUser(e.target.value)}
                                />
                                <Button
                                    className="w-full"
                                    onClick={() => connectAccount('github', githubUser)}
                                    isLoading={connecting === 'github'}
                                >
                                    Connect GitHub
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* LeetCode */}
                <Card className="items-center">
                    <CardHeader className="text-center">
                        <Code className="mx-auto h-12 w-12 mb-2 text-yellow-500" />
                        <CardTitle>LeetCode</CardTitle>
                        <CardDescription>Showcase problems solved and ranking</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isConnected('leetcode') ? (
                            <div className="flex items-center justify-center text-green-400 bg-green-400/10 p-2 rounded">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Connected as {accounts.find(a => a.platform === 'leetcode')?.platform_username}
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="LeetCode Username"
                                    value={leetcodeUser}
                                    onChange={(e) => setLeetcodeUser(e.target.value)}
                                />
                                <Button
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                                    onClick={() => connectAccount('leetcode', leetcodeUser)}
                                    isLoading={connecting === 'leetcode'}
                                >
                                    Connect LeetCode
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* GeeksForGeeks */}
                <Card className="items-center">
                    <CardHeader className="text-center">
                        <Terminal className="mx-auto h-12 w-12 mb-2 text-green-500" />
                        <CardTitle>GeeksForGeeks</CardTitle>
                        <CardDescription>Display coding score and institute rank</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isConnected('geeksforgeeks') ? (
                            <div className="flex items-center justify-center text-green-400 bg-green-400/10 p-2 rounded">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Connected as {accounts.find(a => a.platform === 'geeksforgeeks')?.platform_username}
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="GFG Username"
                                    value={gfgUser}
                                    onChange={(e) => setGfgUser(e.target.value)}
                                />
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => connectAccount('geeksforgeeks', gfgUser)}
                                    isLoading={connecting === 'geeksforgeeks'}
                                >
                                    Connect GFG
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
