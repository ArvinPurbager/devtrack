import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const LANGUAGE_IDS = {
  python: 71,
  typescript: 74,
  java: 62,
  cpp: 54,
  go: 60,
  rust: 73,
  bash: 46,
}

const MAX_CODE_LENGTH = 10000
const COOLDOWN_MS = 3000
const lastRun = new Map()

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const now = Date.now()
  const previous = lastRun.get(user.id)
  if (previous && now - previous < COOLDOWN_MS) {
    return NextResponse.json({ error: 'Slow down a moment before running again.' }, { status: 429 })
  }
  lastRun.set(user.id, now)

  const { code, language } = await request.json()

  if (!code || !language) {
    return NextResponse.json({ error: 'Missing code or language' }, { status: 400 })
  }

  if (typeof code !== 'string' || code.length > MAX_CODE_LENGTH) {
    return NextResponse.json({ error: 'Code is too long to run here.' }, { status: 400 })
  }

  const languageId = LANGUAGE_IDS[language]
  if (!languageId) {
    return NextResponse.json({ error: 'Language not supported for execution' }, { status: 400 })
  }

  try {
    const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: languageId,
        source_code: Buffer.from(code, 'utf8').toString('base64'),
      }),
    })
    if (res.status === 429) {
      return NextResponse.json({ error: 'Execution service is busy (rate limited). Try again in a moment.' }, { status: 429 })
    }
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Execution service error: ' + text }, { status: 502 })
    }
    const data = await res.json()
    const decode = (val) => val ? Buffer.from(val, 'base64').toString('utf8') : ''
    return NextResponse.json({
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      compileOutput: decode(data.compile_output),
      exitCode: data.status?.id === 3 ? 0 : data.status?.id,
      statusDescription: data.status?.description || '',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach execution service' }, { status: 502 })
  }
}
