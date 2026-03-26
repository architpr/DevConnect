"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Calendar, ExternalLink, Loader2 } from "lucide-react"

type Platform = {
    id: string
    name: string
    url: string
    date: string
    description: string
}

export default function PlatformsPage() {
    const supabase = createClient()
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlatforms = async () => {
            const { data } = await supabase
                .from('platforms')
                .select('*')
                .order('date', { ascending: true })

            if (data) setPlatforms(data)
            setLoading(false)
        }

        fetchPlatforms()
    }, [supabase])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    ContestHub
                </h1>
                <p className="text-gray-400 mt-2">Discover upcoming hackathons and coding contests.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map(platform => (
                        <Card key={platform.id} className="hover:border-purple-500/30 transition-colors">
                            <CardHeader>
                                <CardTitle>{platform.name}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {new Date(platform.date).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-300 text-sm line-clamp-3">
                                    {platform.description}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <a href={platform.url} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button variant="outline" className="w-full group">
                                        Visit Platform
                                        <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </a>
                            </CardFooter>
                        </Card>
                    ))}

                    {platforms.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No upcoming platforms found. Check back later!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
