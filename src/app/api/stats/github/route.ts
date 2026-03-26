import { NextRequest, NextResponse } from 'next/server'

type Repo = {
    name: string
    description: string | null
    html_url: string
    stargazers_count: number
    forks_count: number
    language: string | null
    updated_at: string
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN

    try {
        // Fetch user profile
        const userResponse = await fetch(`https://api.github.com/users/${username}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!userResponse.ok) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userData = await userResponse.json()

        // Fetch repos (up to 100)
        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const repos: Repo[] = await reposResponse.json()

        // Calculate stats
        const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0)
        const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0)

        // Language breakdown
        const languageCounts: { [key: string]: number } = {}
        repos.forEach(repo => {
            if (repo.language) {
                languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
            }
        })

        const topLanguages = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([lang, count]) => ({ language: lang, repos: count }))

        // Top repos (by stars, then by recent activity)
        const topRepos = [...repos]
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 5)
            .map(repo => ({
                name: repo.name,
                description: repo.description,
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
            }))

        // Calculate account age
        const createdAt = new Date(userData.created_at)
        const now = new Date()
        const accountAgeYears = Math.floor((now.getTime() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

        return NextResponse.json({
            username,
            name: userData.name || username,
            avatarUrl: userData.avatar_url,
            bio: userData.bio,
            company: userData.company,
            location: userData.location,
            blog: userData.blog,
            // Stats
            publicRepos: userData.public_repos || 0,
            publicGists: userData.public_gists || 0,
            followers: userData.followers || 0,
            following: userData.following || 0,
            totalStars,
            totalForks,
            // Languages
            topLanguages,
            primaryLanguage: topLanguages[0]?.language || null,
            // Top repos
            topRepos,
            // Account info
            accountAgeYears,
            createdAt: userData.created_at,
            // URLs
            profileUrl: userData.html_url,
        })
    } catch (error) {
        console.error('GitHub API error:', error)
        return NextResponse.json({ error: 'Failed to fetch GitHub stats' }, { status: 500 })
    }
}

