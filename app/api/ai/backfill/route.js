import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: logs } = await supabase
    .from('build_logs')
    .select('id, content, entry_type')
    .eq('user_id', user.id)
    .is('ai_scores', null)

  const results = []
  for (const log of logs || []) {
    const res = await fetch(`${request.nextUrl.origin}/api/ai/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({ log_id: log.id, content: log.content, entry_type: log.entry_type }),
    })
    const data = await res.json()
    results.push({ id: log.id, ok: res.ok, data })
  }

  return NextResponse.json({ scored: results.length, results })
}
