import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

export const runtime = 'nodejs'

const SKILL_KEYWORDS = [
    'javascript', 'typescript', 'react', 'next.js', 'node.js', 'node', 'python', 'java', 'c++', 'c#',
    'go', 'rust', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws',
    'azure', 'gcp', 'git', 'graphql', 'rest api', 'tailwind', 'html', 'css', 'system design',
    'data structures', 'algorithms', 'machine learning', 'tensorflow', 'pytorch', 'django', 'spring boot'
]

const RESUME_SECTION_PATTERNS = [
    /\b(summary|objective|profile)\b/i,
    /\b(experience|work experience|professional experience)\b/i,
    /\b(education|academic background)\b/i,
    /\b(skills|technical skills|core competencies)\b/i,
    /\b(projects|personal projects)\b/i,
    /\b(certifications|achievements|awards)\b/i
]

const ACTION_VERBS = [
    'built', 'developed', 'implemented', 'designed', 'led', 'optimized', 'improved', 'deployed', 'created', 'delivered'
]

type ResumeSignals = {
    wordCount: number
    sectionMatches: number
    hasEmail: boolean
    hasPhone: boolean
    hasLinkedIn: boolean
    hasGitHub: boolean
    bulletLines: number
    actionVerbHits: number
    quantifiedAchievementHits: number
    topSkills: string[]
}

type AtsAnalysis = {
    isResume?: boolean
    atsScore: number
    summary: string
    topSkills: string[]
    suggestions: string[]
}

type GeminiAtsPayload = {
    isResume?: boolean
    atsScore?: number | string
    summary?: string
    topSkills?: string[]
    suggestions?: string[]
}

const GEMINI_API_VERSIONS = ['v1', 'v1beta'] as const

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(text: string): string {
    return text
        .replace(/\u0000/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function buildResumeSignals(text: string): ResumeSignals {
    const normalized = normalizeText(text)
    const lower = normalized.toLowerCase()
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)

    const wordCount = normalized ? normalized.split(/\s+/).length : 0
    const sectionMatches = RESUME_SECTION_PATTERNS.reduce((count, pattern) => count + (pattern.test(lower) ? 1 : 0), 0)
    const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(normalized)
    const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(normalized)
    const hasLinkedIn = /linkedin\.com\//i.test(lower)
    const hasGitHub = /github\.com\//i.test(lower)
    const bulletLines = lines.filter(line => /^[•\u2022\-*]\s+/.test(line) || /^\d+\.\s+/.test(line)).length
    const actionVerbHits = ACTION_VERBS.reduce((count, verb) => {
        const matches = lower.match(new RegExp(`\\b${verb}\\b`, 'g'))
        return count + (matches?.length || 0)
    }, 0)
    const quantifiedAchievementHits = (normalized.match(/\b\d+(?:\.\d+)?%\b|\$\s?\d+[\d,.]*|\b\d+\+\b/g) || []).length

    const topSkills = SKILL_KEYWORDS
        .filter(skill => new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i').test(lower))
        .slice(0, 8)
        .map(skill => {
            if (skill === 'next.js') return 'Next.js'
            if (skill === 'node.js') return 'Node.js'
            return skill.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
        })

    return {
        wordCount,
        sectionMatches,
        hasEmail,
        hasPhone,
        hasLinkedIn,
        hasGitHub,
        bulletLines,
        actionVerbHits,
        quantifiedAchievementHits,
        topSkills
    }
}

function isLikelyResume(signals: ResumeSignals, extractedText: string): boolean {
    const textLower = extractedText.toLowerCase()

    // Anti-signals commonly found in reports, papers, and assignments
    const antiSignals = [
        /\b(table of contents|abstract|introduction|conclusion|chapter \d+|bibliography|references|figure \d+|table \d+)\b/g,
        /\b(course|assignment|student id|professor|semester|department of)\b/g
    ]
    let antiSignalHits = 0
    antiSignals.forEach(pattern => {
        const matches = textLower.match(pattern)
        if (matches) antiSignalHits += matches.length
    })

    if (antiSignalHits >= 3) return false // Very likely an academic or business report

    // Contact info is practically mandatory for a resume
    const hasContact = signals.hasEmail || signals.hasPhone || signals.hasLinkedIn || signals.hasGitHub
    if (!hasContact) return false

    let confidence = 0

    if (signals.wordCount >= 80 && signals.wordCount <= 2000) confidence += 1
    if (signals.wordCount >= 180) confidence += 1
    if (signals.sectionMatches >= 2) confidence += 1
    if (signals.sectionMatches >= 3) confidence += 1
    if (signals.bulletLines >= 3) confidence += 1
    if (signals.actionVerbHits >= 3) confidence += 1
    if (signals.topSkills.length >= 2) confidence += 1

    return confidence >= 4
}

function buildSuggestions(signals: ResumeSignals): string[] {
    const suggestions: string[] = []

    if (!signals.hasEmail || !signals.hasPhone) {
        suggestions.push('Add complete contact details (email and phone) at the top of the resume.')
    }
    if (!signals.hasLinkedIn && !signals.hasGitHub) {
        suggestions.push('Include LinkedIn or GitHub profile links to strengthen your application.')
    }
    if (signals.sectionMatches < 4) {
        suggestions.push('Use clear headings like Summary, Experience, Skills, Projects, and Education for ATS parsing.')
    }
    if (signals.quantifiedAchievementHits < 3) {
        suggestions.push('Add measurable impact (percentages, numbers, outcomes) to your project and experience bullets.')
    }
    if (signals.topSkills.length < 5) {
        suggestions.push('Add a stronger technical skills section with relevant tools and frameworks.')
    }
    if (signals.wordCount < 220) {
        suggestions.push('Expand project and experience details so recruiters can better evaluate your profile.')
    }

    if (suggestions.length === 0) {
        suggestions.push('Tailor resume keywords to each target role and keep achievements impact-focused.')
    }

    return suggestions.slice(0, 5)
}

function buildSummary(signals: ResumeSignals, atsScore: number): string {
    const skillText = signals.topSkills.length > 0
        ? `Key skills detected: ${signals.topSkills.slice(0, 4).join(', ')}.`
        : 'Technical skills were detected, but they can be highlighted more clearly.'

    if (atsScore >= 75) {
        return `This resume is well-structured for ATS with solid resume sections and clear technical positioning. ${skillText}`
    }
    if (atsScore >= 55) {
        return `This resume has a good foundation but needs stronger keyword coverage and clearer impact statements to improve ATS performance. ${skillText}`
    }
    return `This resume currently has limited ATS readability and should be revised with clearer sections, relevant keywords, and quantified achievements. ${skillText}`
}

function computeAtsAnalysis(signals: ResumeSignals): AtsAnalysis {
    const sectionScore = Math.min(signals.sectionMatches / 5, 1) * 24
    const skillsScore = Math.min(signals.topSkills.length / 8, 1) * 18
    const contactScore =
        (signals.hasEmail ? 7 : 0) +
        (signals.hasPhone ? 6 : 0) +
        (signals.hasLinkedIn ? 4 : 0) +
        (signals.hasGitHub ? 4 : 0)
    const impactScore = Math.min(signals.quantifiedAchievementHits / 4, 1) * 16
    const actionScore = Math.min(signals.actionVerbHits / 8, 1) * 10
    const bulletScore = Math.min(signals.bulletLines / 8, 1) * 10

    let lengthScore = 0
    if (signals.wordCount >= 350 && signals.wordCount <= 800) {
        lengthScore = 8
    } else if (signals.wordCount >= 220 && signals.wordCount <= 1000) {
        lengthScore = 5
    } else if (signals.wordCount >= 120) {
        lengthScore = 2
    }

    let score = 8
    score += sectionScore
    score += skillsScore
    score += contactScore
    score += impactScore
    score += actionScore
    score += bulletScore
    score += lengthScore

    // Keep 100 reserved for near-perfect resumes instead of ordinary strong ones.
    if (score > 96) {
        score = 96
    }

    const atsScore = Math.round(Math.min(100, Math.max(0, score)))

    return {
        isResume: true,
        atsScore,
        summary: buildSummary(signals, atsScore),
        topSkills: signals.topSkills,
        suggestions: buildSuggestions(signals)
    }
}

function sanitizeGeminiAnalysis(parsed: GeminiAtsPayload, fallback: AtsAnalysis): AtsAnalysis {
    const safeSummary = typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallback.summary

    const safeTopSkills = Array.isArray(parsed.topSkills) && parsed.topSkills.length > 0
        ? parsed.topSkills.filter(Boolean).slice(0, 8)
        : fallback.topSkills

    const safeSuggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
        ? parsed.suggestions.filter(Boolean).slice(0, 5)
        : fallback.suggestions

    return {
        // Keep ATS score deterministic; AI can refine wording but should not override the numeric score.
        isResume: typeof parsed.isResume === 'boolean' ? parsed.isResume : fallback.isResume,
        atsScore: fallback.atsScore,
        summary: safeSummary,
        topSkills: safeTopSkills,
        suggestions: safeSuggestions,
    }
}

async function computeGeminiAtsAnalysis(
    resumeText: string,
    signals: ResumeSignals,
    fallback: AtsAnalysis
): Promise<AtsAnalysis> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return fallback

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

    const resumeExcerpt = resumeText.slice(0, 12000)
    const prompt = `You are an ATS resume evaluator for software roles.

First, determine if the provided text is actually a resume. If the document is clearly NOT a resume (e.g., a report, research paper, article, assignment, or book), set "isResume" to false and provide a summary explaining why.
If it IS a resume, evaluate it.

Return ONLY valid JSON:
{
  "isResume": <boolean>,
  "atsScore": <integer 0-100>,
  "summary": "<2-3 sentence ATS-focused summary>",
  "topSkills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>"],
  "suggestions": ["<improvement1>", "<improvement2>", "<improvement3>", "<improvement4>"]
}

Rules:
- Do not return markdown.
- Score based on structure, relevance, measurable achievements, clarity, and keyword alignment.
- Keep suggestions practical and specific.

Resume signals:
- wordCount: ${signals.wordCount}
- sectionMatches: ${signals.sectionMatches}
- hasEmail: ${signals.hasEmail}
- hasPhone: ${signals.hasPhone}
- hasLinkedIn: ${signals.hasLinkedIn}
- hasGitHub: ${signals.hasGitHub}
- bulletLines: ${signals.bulletLines}
- actionVerbHits: ${signals.actionVerbHits}
- quantifiedAchievementHits: ${signals.quantifiedAchievementHits}
- detectedSkills: ${signals.topSkills.join(', ') || 'None'}

Resume text:
"""
${resumeExcerpt}
"""`

    for (const version of GEMINI_API_VERSIONS) {
        for (const model of candidateModels) {
            const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`
            try {
                const response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 900,
                        },
                    }),
                })

                if (!response.ok) {
                    continue
                }

                const data = await response.json()
                const responseText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
                if (!responseText) {
                    continue
                }

                const cleaned = responseText
                    .replace(/```json\n?/gi, '')
                    .replace(/```\n?/g, '')
                    .trim()

                const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
                if (!jsonMatch) {
                    continue
                }

                const parsed = JSON.parse(jsonMatch[0]) as GeminiAtsPayload
                return sanitizeGeminiAnalysis(parsed, fallback)
            } catch {
                continue
            }
        }
    }

    return fallback
}

async function extractPdfText(resumeUrl: string): Promise<string> {
    const response = await fetch(resumeUrl, { cache: 'no-store' })
    if (!response.ok) {
        throw new Error('Unable to download resume file')
    }

    const contentType = response.headers.get('content-type') || ''
    const looksLikePdfUrl = resumeUrl.toLowerCase().includes('.pdf')
    if (!contentType.toLowerCase().includes('pdf') && !looksLikePdfUrl) {
        throw new Error('Only PDF resumes are supported for ATS analysis')
    }

    const bytes = await response.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.byteLength === 0) {
        throw new Error('Uploaded PDF is empty')
    }

    const parseFn = (pdfParse as any).default || pdfParse
    const parsed = await parseFn(buffer)
    const extractedText = normalizeText(parsed.text || '')

    if (extractedText.length < 40) {
        throw new Error('Unable to extract enough text from this PDF. Please upload a text-based PDF resume.')
    }

    return extractedText
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { resumeUrl } = body

        if (!resumeUrl) {
            return NextResponse.json({ error: 'Resume URL is required' }, { status: 400 })
        }

        const pdfText = await extractPdfText(resumeUrl)
        const signals = buildResumeSignals(pdfText)

        if (!isLikelyResume(signals, pdfText)) {
            return NextResponse.json({
                error: 'Uploaded PDF does not appear to be a resume. Please upload a structured resume document.'
            }, { status: 422 })
        }

        const heuristicAnalysis = computeAtsAnalysis(signals)
        const analysis = await computeGeminiAtsAnalysis(pdfText, signals, heuristicAnalysis)

        if (analysis.isResume === false) {
            return NextResponse.json({
                error: 'AI analysis determined this document is not a valid resume.'
            }, { status: 422 })
        }

        return NextResponse.json(analysis)

    } catch (error) {
        console.error('Resume analysis error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Resume analysis failed'
        return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
}
