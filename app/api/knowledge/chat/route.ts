import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { query } = await req.json()
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  // Get published articles as context
  const articles = await db.knowledgeArticle.findMany({
    where: { orgId: session.user.orgId, isPublished: true },
    select: { title: true, content: true, category: true },
    take: 10,
    orderBy: { viewCount: 'desc' },
  })

  const context = articles
    .map((a) => `## ${a.title}\n${a.content}`)
    .join('\n\n---\n\n')

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      answer:
        'AI chat is not configured yet. Add a GEMINI_API_KEY to your environment to enable this feature.',
    })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful assistant for Mid TN Volleyball Club.
Answer questions based on the knowledge base articles provided below.
If the answer is not in the knowledge base, say so clearly.
Be concise and friendly.

Knowledge Base:
${context}

User Question: ${query}`,
      config: { temperature: 0.4 },
    })

    return NextResponse.json({ answer: response.text })
  } catch {
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    )
  }
}
