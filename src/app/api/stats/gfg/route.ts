import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    try {
        // Try multiple GFG API endpoints
        const gfgApiUrl = `https://geeks-for-geeks-stats-api.vercel.app/?userName=${username}`

        const response = await fetch(gfgApiUrl, {
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (response.ok) {
            const data = await response.json()

            return NextResponse.json({
                username,
                codingScore: data.totalScore || data.codingScore || 0,
                problemsSolved: data.totalSolved || data.totalProblemsSolved || 0,
                monthlyScore: data.monthlyScore || 0,
                streak: data.streak || data.currentStreak || 0,
                instituteRank: data.instituteRank || 'N/A',
                profileUrl: `https://www.geeksforgeeks.org/user/${username}/`,
            })
        }

        // Fallback: try alternative API
        const altApiUrl = `https://gfg-api.vercel.app/api/${username}`
        const altResponse = await fetch(altApiUrl, {
            next: { revalidate: 3600 }
        })

        if (altResponse.ok) {
            const altData = await altResponse.json()

            return NextResponse.json({
                username,
                codingScore: altData.info?.codingScore || 0,
                problemsSolved: altData.info?.problemsSolved || 0,
                monthlyScore: altData.info?.monthlyScore || 0,
                streak: altData.info?.streak || 0,
                instituteRank: altData.info?.instituteRank || 'N/A',
                profileUrl: `https://www.geeksforgeeks.org/user/${username}/`,
            })
        }

        // If both APIs fail, return zeros with a message
        return NextResponse.json({
            username,
            codingScore: 0,
            problemsSolved: 0,
            monthlyScore: 0,
            streak: 0,
            instituteRank: 'N/A',
            profileUrl: `https://www.geeksforgeeks.org/user/${username}/`,
            note: 'Stats may be temporarily unavailable'
        })

    } catch (error) {
        console.error('GFG API error:', error)
        return NextResponse.json({
            username,
            codingScore: 0,
            problemsSolved: 0,
            monthlyScore: 0,
            profileUrl: `https://www.geeksforgeeks.org/user/${username}/`,
            error: 'Failed to fetch GFG stats'
        })
    }
}
