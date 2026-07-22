import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Octokit } from 'octokit'
import { notFound } from 'next/navigation'
import CodeBlock from '@/app/components/CodeBlock'
import ProgressRow from '@/app/components/ProgressRow'
import OwnerBadge from '@/app/components/OwnerBadge'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
export const revalidate = 60
const AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#6366f1']
function colorForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
export default async function PublicProfilePage({ params }) {
  const { username } = await params
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, github_username, auth_type')
    .eq('github_username', username)
    .single()
  if (!profile) notFound()
  const matchedUserId = profile.user_id
  const isGithub = (profile.auth_type || 'github') === 'github'
  const avatarColor = colorForName(username)
  let githubProfile = null
  let repos = []
  if (isGithub) {
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: tokenRow } = await serviceClient
      .from('user_tokens')
      .select('github_access_token')
      .eq('user_id', matchedUserId)
      .single()
    if (!tokenRow?.github_access_token) notFound()
    try {
      const octokit = new Octokit({ auth: tokenRow.github_access_token })
      const { data: ghUser } = await octokit.rest.users.getAuthenticated()
      const { data: ghRepos } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'pushed', per_page: 10, visibility: 'public',
      })
      githubProfile = ghUser
      repos = ghRepos
    } catch (e) {
      notFound()
    }
  }
  const { data: logs } = await supabase
    .from('build_logs')
    .select('*')
    .eq('user_id', matchedUserId)
    .order('created_at', { ascending: true })
  const { data: userProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', matchedUserId)
    .order('created_at', { ascending: true })
  // group entries by project, newest first within each project
  const projectGroups = (userProjects || []).map(proj => ({
    project: proj,
    entries: [...(logs || [])].filter(l => l.project_id === proj.id).reverse(),
  })).filter(g => g.entries.length > 0)
  const typeConfig = {
    struggle: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400', badge: 'bg-red-900 text-red-300', bar: 'bg-red-500', hex: '#ef4444' },
    decision: { bg: 'bg-blue-950', border: 'border-blue-800', text: 'text-blue-400', badge: 'bg-blue-900 text-blue-300', bar: 'bg-blue-500', hex: '#3b82f6' },
    solved: { bg: 'bg-emerald-950', border: 'border-emerald-800', text: 'text-emerald-400', badge: 'bg-emerald-900 text-emerald-300', bar: 'bg-emerald-500', hex: '#10b981' },
  }
  const entryCount = logs?.length || 0
  const typeBreakdown = ['decision', 'struggle', 'solved'].map(type => ({
    type, count: logs?.filter(l => l.entry_type === type).length || 0,
  })).filter(t => t.count > 0)
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
  const displayName = isGithub ? (githubProfile.name || username) : username
  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-5 mb-10">
          {isGithub ? (
            <img src={githubProfile.avatar_url} alt={username} className="w-20 h-20 rounded-full" />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-medium text-white shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-medium mb-1">{displayName}</h1>
            <p className="text-gray-400 text-sm mb-3">@{username}</p>
            {isGithub && githubProfile.bio && <p className="text-gray-300 text-sm mb-3">{githubProfile.bio}</p>}
            <div className="flex gap-4 flex-wrap items-center">
              <span className="text-xs text-gray-500">{entryCount} build log {entryCount === 1 ? 'entry' : 'entries'}</span>
              {isGithub && <span className="text-xs text-gray-500">{repos?.length || 0} public repos</span>}
              {typeBreakdown.map(t => (
                <Badge key={t.type} className={typeConfig[t.type]?.badge || ''}>
                  {t.count} {t.type}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <OwnerBadge ownerId={matchedUserId} />
            {isGithub && (
              <a href={githubProfile.html_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">
                GitHub ↗
              </a>
            )}
          </div>
        </div>
        <Separator className="bg-gray-800 mb-10" />
        {hasGrowthData && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-gray-300 uppercase tracking-widest mb-6">Growth over time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(growthData).map(([type, points]) => {
                const cfg = typeConfig[type]
                const W = 180
                const H = 72
                const pad = 6
                const maxScore = 10
                const xStep = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0
                const toX = i => pad + i * xStep
                const toY = v => H - pad - ((v / maxScore) * (H - pad * 2))
                const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + toX(i).toFixed(1) + ' ' + toY(p.avg).toFixed(1)).join(' ')
                const firstAvg = points[0].avg
                const lastAvg = points[points.length - 1].avg
                const trend = lastAvg - firstAvg
                return (
                  <div key={type} className="border border-gray-800 bg-gray-900 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={cfg.badge}>{type}</Badge>
                      <span className="text-xs text-gray-500">{points.length} {points.length === 1 ? 'entry' : 'entries'}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-1.5">
                      {firstAvg} → {lastAvg}{' '}
                      {trend > 0 && <span className="text-emerald-400">+{trend.toFixed(1)}</span>}
                      {trend < 0 && <span className="text-red-400">{trend.toFixed(1)}</span>}
                      {trend === 0 && <span className="text-gray-500">steady</span>}
                    </div>
                    <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={{ display: 'block', marginBottom: '4px' }}>
                      <line x1={pad} y1={toY(2)} x2={W - pad} y2={toY(2)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <line x1={pad} y1={toY(6)} x2={W - pad} y2={toY(6)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <line x1={pad} y1={toY(10)} x2={W - pad} y2={toY(10)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <path d={pathD} fill="none" stroke={cfg.hex} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={toX(0)} cy={toY(points[0].avg)} r="2.5" fill={cfg.hex} />
                      <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].avg)} r="2.5" fill={cfg.hex} />
                    </svg>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">{points[0].date}</span>
                      <span className="text-xs text-gray-600">{points[points.length - 1].date}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div>
          {projectGroups.length > 1 && (
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-300 uppercase tracking-widest mb-3">Projects</p>
              <div className="flex gap-2 flex-wrap">
                {projectGroups.map(group => (
                  <a key={group.project.id} href={'#project-' + group.project.id}
                    className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-full px-4 py-2 transition-colors"
                  >
                    {group.project.name}
                    <span className="text-gray-500">{group.entries.length}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          <h2 className="text-lg font-medium text-gray-300 uppercase tracking-widest mb-6">Build log</h2>
          {projectGroups.length === 0 ? (
            <p className="text-gray-500 text-sm">No build log entries yet.</p>
          ) : (
            <div className="space-y-10">
              {projectGroups.map(group => (
                <div key={group.project.id} id={'project-' + group.project.id} className="scroll-mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-base font-medium text-white">{group.project.name}</h3>
                    <span className="text-xs text-gray-500">{group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  <div className="space-y-4">
              {group.entries.map(log => {
                if (log.entry_type === 'progress') {
                  return <ProgressRow key={log.id} log={log} />
                }
                const cfg = typeConfig[log.entry_type] || typeConfig.decision
                const s = log.ai_scores
                const m1key = s?._metric1_key
                const m2key = s?._metric2_key
                return (
                  <div key={log.id} className={'border rounded-xl px-4 py-4 ' + cfg.bg + ' ' + cfg.border}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={cfg.badge}>{log.entry_type}</Badge>
                      {log.is_retrospective && <span className={'text-xs opacity-50 ' + cfg.text}>(from memory)</span>}
                      {log.repo_name && <span className={'text-xs opacity-40 ' + cfg.text}>{log.repo_name.split('/')[1]}</span>}
                      {log.code_snippet && <span className={'text-xs opacity-50 ' + cfg.text}>+ code</span>}
                    </div>
                    {log.code_snippet && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-gray-700">
                        <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-700">
                          <span className="text-xs text-gray-400 font-mono">{log.code_language || 'code'}</span>
                        </div>
                        <CodeBlock code={log.code_snippet} language={log.code_language} />
                      </div>
                    )}
                    <p className={'text-sm leading-relaxed mb-3 ' + cfg.text}>{log.content}</p>
                    {s && m1key && m2key && (
                      <div className="rounded-lg p-3 bg-black/20 border border-white/5 space-y-3">
                        <div className="flex gap-6">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs opacity-60">{s._metric1_label}</span>
                              <span className="text-xs font-semibold">{s[m1key]}/10</span>
                            </div>
                            <div className="h-1 rounded-full bg-white/10">
                              <div className={'h-1 rounded-full ' + cfg.bar} style={{ width: (s[m1key] * 10) + '%' }} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs opacity-60">{s._metric2_label}</span>
                              <span className="text-xs font-semibold">{s[m2key]}/10</span>
                            </div>
                            <div className="h-1 rounded-full bg-white/10">
                              <div className={'h-1 rounded-full ' + cfg.bar} style={{ width: (s[m2key] * 10) + '%' }} />
                            </div>
                          </div>
                        </div>
                        <p className={'text-xs italic opacity-50 pt-1 border-t border-white/5 ' + cfg.text}>"{s.one_line_insight}"</p>
                      </div>
                    )}
                    <p className={'text-xs opacity-40 mt-3 ' + cfg.text}>
                      {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )
              })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
