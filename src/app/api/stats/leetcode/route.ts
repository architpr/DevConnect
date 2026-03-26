import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    try {
        // Use alfa-leetcode-api for comprehensive stats
        const baseUrl = 'https://alfa-leetcode-api.onrender.com'

        // Fetch multiple endpoints in parallel
        const [solvedRes, contestRes, profileRes] = await Promise.all([
            fetch(`${baseUrl}/${username}/solved`).catch(() => null),
            fetch(`${baseUrl}/${username}/contest`).catch(() => null),
            fetch(`${baseUrl}/${username}`).catch(() => null),
        ])

        let solvedData = null
        let contestData = null
        let profileData = null

        if (solvedRes?.ok) solvedData = await solvedRes.json()
        if (contestRes?.ok) contestData = await contestRes.json()
        if (profileRes?.ok) profileData = await profileRes.json()

        // Fallback to simpler API if alfa fails
        if (!solvedData) {
            try {
                const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`)
                if (response.ok) {
                    const data = await response.json()
                    return NextResponse.json({
                        username,
                        totalSolved: data.totalSolved || 0,
                        easySolved: data.easySolved || 0,
                        mediumSolved: data.mediumSolved || 0,
                        hardSolved: data.hardSolved || 0,
                        totalQuestions: data.totalQuestions || 3000,
                        ranking: data.ranking || 'N/A',
                        acceptanceRate: data.acceptanceRate || null,
                        contributionPoints: data.contributionPoints || 0,
                        reputation: data.reputation || 0,
                        contestRating: null,
                        contestRanking: null,
                        contestsAttended: 0,
                        badges: [],
                        streak: 0,
                        profileUrl: `https://leetcode.com/${username}`,
                    })
                }
            } catch {
                // Continue with zeros
            }
        }

        // Build comprehensive response
        return NextResponse.json({
            username,
            // Solved problems
            totalSolved: solvedData?.solvedProblem || 0,
            easySolved: solvedData?.easySolved || 0,
            mediumSolved: solvedData?.mediumSolved || 0,
            hardSolved: solvedData?.hardSolved || 0,
            totalQuestions: (solvedData?.totalEasy || 0) + (solvedData?.totalMedium || 0) + (solvedData?.totalHard || 0) || 3000,
            // Contest info
            contestRating: contestData?.contestRating ? Math.round(contestData.contestRating) : null,
            contestRanking: contestData?.contestGlobalRanking || null,
            contestsAttended: contestData?.contestAttend || 0,
            topPercentage: contestData?.contestTopPercentage || null,
            // Profile info
            ranking: profileData?.ranking || 'N/A',
            badges: profileData?.badges?.map((b: { displayName: string }) => b.displayName) || [],
            streak: profileData?.streakCounter || 0,
            reputation: profileData?.reputation || 0,
            // Submission stats
            totalSubmissions: profileData?.totalSubmissions?.[0]?.submissions || 0,
            acceptanceRate: solvedData?.solvedProblem && profileData?.totalSubmissions?.[0]?.submissions
                ? Math.round((solvedData.solvedProblem / profileData.totalSubmissions[0].submissions) * 10000) / 100
                : null,
            // Profile URL
            profileUrl: `https://leetcode.com/${username}`,
        })
    } catch (error) {
        console.error('LeetCode API error:', error)
        return NextResponse.json({
            error: 'Failed to fetch LeetCode stats',
            username,
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            ranking: 'N/A',
            profileUrl: `https://leetcode.com/${username}`,
        })
    }
}

