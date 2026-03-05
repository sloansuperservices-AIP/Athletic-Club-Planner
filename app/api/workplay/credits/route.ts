import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getCreditLeaderboard, getUserCredits } from '@/lib/dibsRules'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId') ?? undefined
  const myCreditsOnly = searchParams.get('mine') === 'true'

  if (myCreditsOnly) {
    const credits = await getUserCredits(session.user.id)
    return NextResponse.json({ credits })
  }

  const leaderboard = await getCreditLeaderboard(session.user.orgId, teamId)
  return NextResponse.json(leaderboard)
}
