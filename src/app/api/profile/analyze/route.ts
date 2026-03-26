import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_VERSIONS = ['v1', 'v1beta'] as const

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { leetcodeStats, githubStats, gfgStats, resumeUrl } = body

        const apiKey = process.env.GEMINI_API_KEY

        // Build profile data string for analysis
        let profileData = 'Candidate Profile Data:\n\n'

        if (leetcodeStats) {
            profileData += `LeetCode:\n`
            profileData += `- Total Problems Solved: ${leetcodeStats.totalSolved || 0}\n`
            profileData += `- Easy: ${leetcodeStats.easySolved || 0}, Medium: ${leetcodeStats.mediumSolved || 0}, Hard: ${leetcodeStats.hardSolved || 0}\n`
            if (leetcodeStats.ranking) profileData += `- Ranking: ${leetcodeStats.ranking}\n`
            if (leetcodeStats.contestRating) profileData += `- Contest Rating: ${leetcodeStats.contestRating}\n`
            if (leetcodeStats.contestsAttended) profileData += `- Contests Attended: ${leetcodeStats.contestsAttended}\n`
            profileData += '\n'
        }

        if (githubStats) {
            profileData += `GitHub:\n`
            profileData += `- Public Repositories: ${githubStats.publicRepos || 0}\n`
            profileData += `- Total Stars: ${githubStats.totalStars || 0}\n`
            profileData += `- Followers: ${githubStats.followers || 0}\n`
            if (githubStats.topLanguages?.length > 0) {
                const langs = githubStats.topLanguages.map((l: { language: string; repos: number }) =>
                    `${l.language} (${l.repos} repos)`
                ).join(', ')
                profileData += `- Top Languages: ${langs}\n`
            }
            if (githubStats.topRepos?.length > 0) {
                profileData += `- Top Projects:\n`
                githubStats.topRepos.forEach((repo: { name: string; stars: number; language: string }) => {
                    profileData += `  * ${repo.name} (${repo.language || 'N/A'}, ${repo.stars} stars)\n`
                })
            }
            profileData += '\n'
        }

        if (gfgStats) {
            profileData += `GeeksForGeeks:\n`
            profileData += `- Coding Score: ${gfgStats.codingScore || 0}\n`
            profileData += `- Problems Solved: ${gfgStats.problemsSolved || 0}\n`
            profileData += '\n'
        }

        if (resumeUrl) {
            profileData += `Resume URL: ${resumeUrl}\n`
        }

        if (!apiKey) {
            // Return mock data if no API key
            return NextResponse.json(getMockInsights(leetcodeStats, githubStats))
        }

        const preferredModels = [
            process.env.GEMINI_MODEL,
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
        ].filter((model): model is string => Boolean(model))

        const discoveredModels = await (async () => {
            for (const version of GEMINI_API_VERSIONS) {
                try {
                    const listResponse = await fetch(`https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`)
                    if (!listResponse.ok) continue

                    const listData = await listResponse.json()
                    const models = (listData.models || []) as Array<{ name?: string; supportedGenerationMethods?: string[] }>
                    const supportsGenerate = models.filter(model =>
                        Array.isArray(model.supportedGenerationMethods) &&
                        model.supportedGenerationMethods.includes('generateContent')
                    )

                    const names = supportsGenerate
                        .map(model => (model.name || '').replace(/^models\//, ''))
                        .filter(Boolean)

                    if (names.length > 0) return names
                } catch {
                    continue
                }
            }

            return [] as string[]
        })()

        const candidateModels = Array.from(new Set([...preferredModels, ...discoveredModels]))

        const prompt = `You are an expert technical recruiter and career advisor. Analyze the following developer profile and provide comprehensive insights.

${profileData}

Based on this data, provide a detailed analysis. Return ONLY valid JSON with this exact structure:
{
    "strengths": ["<strength1>", "<strength2>", "<strength3>", "<strength4>"],
    "improvements": ["<area for improvement 1>", "<area 2>", "<area 3>", "<area 4>"],
    "careerPaths": ["<career path 1>", "<career path 2>", "<career path 3>", "<career path 4>"],
    "skillGaps": [
        {"skill": "<skill name>", "priority": "High"},
        {"skill": "<skill name>", "priority": "Medium"},
        {"skill": "<skill name>", "priority": "Medium"},
        {"skill": "<skill name>", "priority": "Low"}
    ],
    "overallScore": <number 0-100>,
    "summary": "<2-3 sentence professional summary of the candidate's profile and potential>"
}

Analysis guidelines:
- Strengths: Highlight technical skills, problem-solving ability, project experience, and any notable achievements
- Improvements: Suggest areas where the candidate could grow (not criticisms, but growth opportunities)
- Career Paths: Suggest 4 suitable roles based on their skills (e.g., Full-Stack Developer, Backend Engineer, DevOps Engineer)
- Skill Gaps: Identify skills that would enhance their profile for the suggested roles. Mark high-demand skills as "High" priority
- Overall Score: Rate the profile from 0-100 based on completeness, skill level, and industry readiness
- Summary: Provide a professional summary highlighting key strengths and potential

Be encouraging but realistic. Focus on growth opportunities.`

        let responseText = ''

        for (const version of GEMINI_API_VERSIONS) {
            for (const model of candidateModels) {
                const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`

                const response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1500,
                        }
                    })
                })

                if (!response.ok) {
                    continue
                }

                const data = await response.json()
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
                if (responseText) {
                    break
                }
            }

            if (responseText) {
                break
            }
        }

        if (!responseText) {
            return NextResponse.json(getMockInsights(leetcodeStats, githubStats))
        }

        try {
            const cleanedText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return NextResponse.json({
                    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
                    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
                    careerPaths: Array.isArray(parsed.careerPaths) ? parsed.careerPaths.slice(0, 5) : [],
                    skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps.slice(0, 5) : [],
                    overallScore: Math.min(100, Math.max(0, parseInt(parsed.overallScore) || 70)),
                    summary: parsed.summary || 'Profile analysis complete.'
                })
            }
        } catch (parseError) {
            console.error('JSON parsing error:', parseError)
        }

        return NextResponse.json(getMockInsights(leetcodeStats, githubStats))

    } catch (error) {
        console.error('Profile analysis error:', error)
        return NextResponse.json({
            error: 'Analysis failed',
            strengths: [],
            improvements: [],
            careerPaths: [],
            skillGaps: [],
            overallScore: 0,
            summary: 'Unable to analyze profile at this time.'
        }, { status: 500 })
    }
}

type MockLeetCodeStats = {
    totalSolved?: number
}

type MockGitHubStats = {
    publicRepos?: number
    topLanguages?: { language: string; repos: number }[]
}

function getMockInsights(
    leetcodeStats: MockLeetCodeStats | null,
    githubStats: MockGitHubStats | null
) {
    const leetcodeSolved = leetcodeStats?.totalSolved || 0
    const githubRepos = githubStats?.publicRepos || 0
    const hasLeetcode = leetcodeSolved > 0
    const hasGithub = githubRepos > 0

    const strengths = []
    const careerPaths = []

    if (hasLeetcode && leetcodeSolved > 100) {
        strengths.push('Strong problem-solving skills demonstrated through LeetCode practice')
        strengths.push('Algorithm and data structure proficiency')
    }
    if (hasGithub && githubRepos > 5) {
        strengths.push('Active GitHub presence with multiple projects')
        if (githubStats?.topLanguages?.length && githubStats.topLanguages.length > 0) {
            strengths.push(`Proficiency in ${githubStats.topLanguages[0]?.language || 'multiple languages'}`)
        }
    }
    if (strengths.length === 0) {
        strengths.push('Demonstrates initiative in learning')
        strengths.push('Building technical foundation')
    }

    if (hasGithub) {
        const topLang = githubStats?.topLanguages?.[0]?.language?.toLowerCase() || ''
        if (topLang.includes('javascript') || topLang.includes('typescript')) {
            careerPaths.push('Full-Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer')
        } else if (topLang.includes('python')) {
            careerPaths.push('Backend Developer', 'Data Engineer', 'ML Engineer', 'Full-Stack Developer')
        } else {
            careerPaths.push('Software Developer', 'Backend Engineer', 'Full-Stack Developer', 'DevOps Engineer')
        }
    } else {
        careerPaths.push('Software Developer', 'Full-Stack Developer', 'Backend Developer', 'Frontend Developer')
    }

    return {
        strengths: strengths.slice(0, 4),
        improvements: [
            'Add quantifiable achievements and metrics',
            'Include more leadership experience',
            'Expand on system design projects',
            'Add certifications or courses'
        ],
        careerPaths,
        skillGaps: [
            { skill: 'Kubernetes', priority: 'High' },
            { skill: 'System Design', priority: 'High' },
            { skill: 'Machine Learning', priority: 'Medium' },
            { skill: 'GraphQL', priority: 'Medium' }
        ],
        overallScore: Math.min(85, 50 + (leetcodeStats?.totalSolved || 0) / 5 + (githubStats?.publicRepos || 0) * 2),
        summary: `Developer with ${hasLeetcode ? `${leetcodeSolved} LeetCode problems solved` : 'coding experience'} and ${hasGithub ? `${githubRepos} GitHub repositories` : 'project experience'}. Shows potential for growth in software development roles.`
    }
}
