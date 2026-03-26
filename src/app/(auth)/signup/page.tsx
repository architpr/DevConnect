"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import Link from "next/link"
import { Mail, Lock, Loader2 } from "lucide-react"

export default function SignupPage() {
    const { signUpWithEmail } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await signUpWithEmail(email, password)
            setSuccess(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Signup failed")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-green-400">
                        Check your email
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-300">
                    <p>We&apos;ve sent a confirmation link to <strong>{email}</strong>.</p>
                    <p className="mt-2">Please verify your email to log in.</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login">
                        <Button variant="ghost">Back to Login</Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                    Create Account
                </CardTitle>
                <p className="text-gray-400 mt-2">Join the community of developers</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="m@example.com"
                        label="Email"
                        icon={<Mail className="h-4 w-4" />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="••••••••"
                        label="Password"
                        icon={<Lock className="h-4 w-4" />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <Button className="w-full" disabled={loading} type="submit">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign Up
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
