import { createClient } from '@/utils/supabase/server'
import { Octokit } from 'octokit'
import { notFound } from 'next/navigation'

export default async function PublicProfilePage({ params }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('user_tokens')
    .select('user_id, github_access_token')

  if (!users || users.length === 0) notFound()

  let matchedUserId = null
  let matchedToken = null
  let githubProfile = null

  for (const row of users) {
    try {
      const octokit = new Octokit({ auth: row.github_access_token })
      const { data: ghUser } = await octokit.rest.users.getAuthenticated()
      if (ghUser.login.toLowerCase() === username.toLowerCase()) {
        matchedUserId = row.user_id
        matchedToken = row.github_access_token
        githubProfile = ghUser
        break
      }
    } catch (e) { continue }
  }

  if (!matchedUserId) notFound()

  const { data: logs } = await supabase
    .from('build_logs')
    .select('*')
    .eq('user_id', matchedUserId)
    .order('created_at', { ascending: true })

  const octokit = new Octokit({ auth: matchedToken })
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'pushed', per_page: 10, visibility: 'public',
  })

  const typeConfig = {
    struggle: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400', badge: 'bg-red-900 text-red-300', bar: 'bg-red-500', hex: '#ef4444' },
    decision: { bg: 'bg-blue-950', border: 'border-blue-800', text: 'text-blue-400', badge: 'bg-blue-900 text-blue-300', bar: 'bg-blue-500', hex: '#3b82f6' },
    solved: { bg: 'bg-emerald-950', border: 'border-emerald-800', text: 'text-emerald-400', badge: 'bg-emerald-900 text-emerald-300', bar: 'bg-emerald-500', hex: '#10b981' },
  }

  const entryCount = logs?.length || 0
  const typeBreakdown = ['decision', 'struggle', 'solved'].map(type => ({
    type, count: logs?.filter(l => l.entry_type === type).length || 0,
  })).filter(t => t.count > 0)

  // Build growth curve data per type
  const growthData = {}
  for (const type of ['decision', 'struggle', 'solved']) {
    const typeLogs = (logs || []).filter(l => l.entry_type === type && l.ai_scores?._metric1_key)
    if (typeLogs.length < 2) continue
    growthData[type] = typeLogs.map((l, i) => ({
      index: i + 1,
      date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      m1: l.ai_scores[l.ai_scores._metric1_key],
      m2: l.ai_scores[l.ai_scores._metric2_key],
      m1label: l.ai_scores._metric1_label,
      m2label: l.ai_scores._metric2_label,
      avg: Math.round((l.ai_scores[l.ai_scores._metric1_key] + l.ai_scores[l.ai_scores._metric2_key]) / 2 * 10) / 10,
    }))
  }

  const hasGrowthData = Object.keys(growthData).length > 0

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-start gap-5 mb-10 pb-10 border-b border-gray-800">
          <img src={githubProfile.avatar_url} alt={username} className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <h1 className="text-2xl font-medium mb-1">{githubProfile.name || username}</h1>
            <p className="text-gray-400 text-sm mb-3">@{username}</p>
            {githubProfile.bio && <p className="text-gray-300 text-sm mb-3">{githubProfile.bio}</p>}
            <div className="flex gap-4 flex-wrap">
              <span className="text-xs text-gray-500">{entryCount} build log {entryCount === 1 ? 'entry' : 'entries'}</span>
              <span className="text-xs text-gray-500">{repos?.length || 0} public repos</span>
              {typeBreakdown.map(t => (
                <span key={t.type} className={'text-xs px-2 py-0.5 rounded-full ' + (typeConfig[t.type]?.badge || '')}>
                  {t.count} {t.type}
                </span>
              ))}
            </div>
          </div>
          <a href={githubProfile.html_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors shrink-0">
            GitHub ↗
          </a>
        </div>

        {hasGrowthData && (
          <div className="mb-12">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-6">Growth over time</h2>
            <div className="space-y-6">
              {Object.entries(growthData).map(([type, points]) => {
                const cfg = typeConfig[type]
                const W = 580
                const H = 80
                const pad = 8
                const maxScore = 10
                const xStep = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0

                const toX = i => pad + i * xStep
                const toY = v => H - pad - ((v / maxScore) * (H - pad * 2))

                const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + toX(i).toFixed(1) + ' ' + toY(p.avg).toFixed(1)).join(' ')
                const firstAvg = points[0].avg
                const lastAvg = points[points.length - 1].avg
                const trend = lastAvg - firstAvg

                return (
                  <div key={type} className={'border rounded-xl p-4 ' + cfg.bg + ' ' + cfg.border}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={'text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ' + cfg.badge}>{type}</span>
                        <span className={'text-xs opacity-60 ' + cfg.text}>{points.length} entries</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={'text-xs opacity-60 ' + cfg.text}>started {firstAvg}/10</span>
                        <span className={'text-xs font-medium ' + cfg.text}>now {lastAvg}/10</span>
                        {trend > 0 && <span className="text-xs text-emerald-400">+{trend.toFixed(1)}</span>}
                        {trend < 0 && <span className="text-xs text-red-400">{trend.toFixed(1)}</span>}
                        {trend === 0 && <span className="text-xs text-gray-500">steady</span>}
                      </div>
                    </div>

                    <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block' }}>
                      {[2, 4, 6, 8, 10].map(v => (
                        <line key={v} x1={pad} y1={toY(v)} x2={W - pad} y2={toY(v)}
                          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      ))}
                      <path d={pathD} fill="none" stroke={cfg.hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <circle key={i} cx={toX(i)} cy={toY(p.avg)} r="3" fill={cfg.hex} />
                      ))}
                    </svg>

                    <div className="flex justify-between mt-1">
                      {points.map((p, i) => (
                        <span key={i} className={'text-xs opacity-30 ' + cfg.text} style={{ fontSize: '10px' }}>{p.date}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-6">Build log</h2>
          {!logs || logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No build log entries yet.</p>
          ) : (
            <div className="space-y-4">
              {[...logs].reverse().map(log => {
                const cfg = typeConfig[log.entry_type] || typeConfig.decision
                const s = log.ai_scores
                const m1key = s?._metric1_key
                const m2key = s?._metric2_key
                return (
                  <div key={log.id} className={'border rounded-xl px-4 py-4 ' + cfg.bg + ' ' + cfg.border}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={'text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ' + cfg.badge}>{log.entry_type}</span>
                      {log.is_retrospective && <span className={'text-xs opacity-50 ' + cfg.text}>(from memory)</span>}
                      {log.repo_name && <span className={'text-xs opacity-40 ' + cfg.text}>{log.repo_name.split('/')[1]}</span>}
                      {log.code_snippet && <span className={'text-xs opacity-50 ' + cfg.text}>+ code</span>}
                    </div>

                    {log.code_snippet && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
                        <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-700">
                          <span className="text-xs text-gray-400 font-mono">{log.code_language || 'code'}</span>
                        </div>
                        <pre className="text-xs text-green-400 bg-gray-950 p-3 overflow-x-auto font-mono leading-relaxed" style={{ maxHeight: '200px' }}>
                          {log.code_snippet}
                        </pre>
                      </div>
                    )}

                    <p className={'text-sm leading-relaxed mb-3 ' + cfg.text}>{log.content}</p>

                    {s && m1key && m2key && (
                      <div className="rounded-lg p-3 bg-black bg-opacity-20 border border-white border-opacity-5 space-y-3">
                        <div className="flex gap-6">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs opacity-60">{s._metric1_label}</span>
                              <span className="text-xs font-semibold">{s[m1key]}/10</span>
                            </div>
                            <div className="h-1 rounded-full bg-white bg-opacity-10">
                              <div className={'h-1 rounded-full ' + cfg.bar} style={{ width: (s[m1key] * 10) + '%' }} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs opacity-60">{s._metric2_label}</span>
                              <span className="text-xs font-semibold">{s[m2key]}/10</span>
                            </div>
                            <div className="h-1 rounded-full bg-white bg-opacity-10">
                              <div className={'h-1 rounded-full ' + cfg.bar} style={{ width: (s[m2key] * 10) + '%' }} />
                            </div>
                          </div>
                        </div>
                        <p className={'text-xs italic opacity-50 pt-1 border-t border-white border-opacity-5 ' + cfg.text}>"{s.one_line_insight}"</p>
                      </div>
                    )}

                    <p className={'text-xs opacity-40 mt-3 ' + cfg.text}>
                      {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
