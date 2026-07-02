import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { log_id, content, entry_type } = await request.json()

  if (!content || !entry_type) {
    return NextResponse.json({ error: 'Missing content or entry_type' }, { status: 400 })
  }

  const scoringGuide = {
    struggle: {
      metric1: { key: 'root_cause', label: 'Root cause identified', coach_key: 'root_cause_coach' },
      metric2: { key: 'attempts_described', label: 'Attempts described', coach_key: 'attempts_coach' },
      metric1_desc: 'Did they identify what actually caused the struggle? (1=symptoms only, 10=clear root cause)',
      metric2_desc: 'Did they explain what they tried before getting stuck? (1=nothing mentioned, 10=clear attempts)',
      metric1_coach: 'A one-sentence tip starting with "Next time:" on how to better identify root cause',
      metric2_coach: 'A one-sentence tip starting with "Next time:" on how to describe attempts more usefully',
    },
    decision: {
      metric1: { key: 'tradeoff_clarity', label: 'Tradeoff clarity', coach_key: 'tradeoff_coach' },
      metric2: { key: 'alternatives_considered', label: 'Alternatives considered', coach_key: 'alternatives_coach' },
      metric1_desc: 'Did they explain why they chose this over alternatives? (1=no reasoning, 10=clear tradeoffs)',
      metric2_desc: 'Did they acknowledge at least one other option? (1=no alternatives, 10=multiple options)',
      metric1_coach: 'A one-sentence tip starting with "Next time:" on how to explain tradeoffs better',
      metric2_coach: 'A one-sentence tip starting with "Next time:" on how to mention alternatives',
    },
    solved: {
      metric1: { key: 'fix_explained', label: 'Fix explained', coach_key: 'fix_coach' },
      metric2: { key: 'future_clarity', label: 'Future clarity', coach_key: 'future_coach' },
      metric1_desc: 'Did they explain what actually solved it? (1=just says it works, 10=clear explanation)',
      metric2_desc: 'Would future-them understand this without context? (1=context-dependent, 10=self-contained)',
      metric1_coach: 'A one-sentence tip starting with "Next time:" on how to better explain the fix',
      metric2_coach: 'A one-sentence tip starting with "Next time:" on how to make the entry more self-contained',
    },

  }

  const guide = scoringGuide[entry_type] || scoringGuide.decision

  const prompt = `You are analyzing a developer's build log entry. Return ONLY a raw JSON object. No markdown, no code fences, no explanation.

Entry type: ${entry_type}
Entry content: "${content}"

Return this exact JSON:
{
  "${guide.metric1.key}": <number 1-10>,
  "${guide.metric1.coach_key}": "<coaching tip for metric 1>",
  "${guide.metric2.key}": <number 1-10>,
  "${guide.metric2.coach_key}": "<coaching tip for metric 2>",
  "one_line_insight": "<one honest specific sentence about what this entry reveals>"
}

Scoring rules:
- ${guide.metric1.key}: ${guide.metric1_desc}
- ${guide.metric1.coach_key}: ${guide.metric1_coach}. Keep it encouraging, not critical. Max 12 words.
- ${guide.metric2.key}: ${guide.metric2_desc}
- ${guide.metric2.coach_key}: ${guide.metric2_coach}. Keep it encouraging, not critical. Max 12 words.
- one_line_insight: Specific and honest. Something the developer couldn't have said about themselves. Not generic praise.

Important: if the score is 8 or above, the coaching tip should affirm what they did well instead of suggesting improvement.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!data.content || !data.content[0]) {
      return NextResponse.json({ error: 'Unexpected API response', detail: data }, { status: 500 })
    }

    let text = data.content[0].text.trim()
    text = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '')

    const scores = JSON.parse(text)
    scores._entry_type = entry_type
    scores._metric1_label = guide.metric1.label
    scores._metric2_label = guide.metric2.label
    scores._metric1_key = guide.metric1.key
    scores._metric2_key = guide.metric2.key
    scores._metric1_coach_key = guide.metric1.coach_key
    scores._metric2_coach_key = guide.metric2.coach_key

    if (log_id) {
      await supabase.from('build_logs').update({
        ai_scores: scores,
      }).eq('id', log_id).eq('user_id', user.id)
    }

    return NextResponse.json({ scores })
  } catch (err) {
    console.error('AI scoring error:', err)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}
