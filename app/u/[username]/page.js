import { createClient } from '@/utils/supabase/server'
import { Octokit } from 'octokit'
import { notFound } from 'next/navigation'

export default async function PublicProfilePage({ params }) {
  const { username } = await params
  const supabase = await createClient()

  // 1. Find the user by their GitHub username
  const { data: users } = await supabase
    .from('user_tokens')
    .select('user_id, github_access_token')

  if (!users || users.length === 0) notFound()

  // Find which user_id matches this GitHub username
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
    } catch (e) {
      continue
    }
  }

  if (!matchedUserId) notFound()

  // 2. Get their build logs
  const { data: logs } = await supabase
    .from('build_logs')
    .select('*')
    .eq('user_id', matchedUserId)
    .order('created_at', { ascending: false })

  // 3. Get their repos
  const octokit = new Octokit({ auth: matchedToken })
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'pushed',
    per_page: 10,
    visibility: 'public',
  })

  const typeConfig = {
    struggle: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400', badge: 'bg-red-900 text-red-300', bar: 'bg-red-500' },
    decision: { bg: 'bg-blue-950', border: 'border-blue-800', text: 'text-blue-400', badge: 'bg-blue-900 text-blue-300', bar: 'bg-blue-500' },
    solved: { bg: 'bg-emerald-950', border: 'border-emerald-800', text: 'text-emerald-400', badge: 'bg-emerald-900 text-emerald-300', bar: 'bg-emerald-500' },
    learning: { bg: 'bg-purple-950', border: 'border-purple-800', text: 'text-purple-400', badge: 'bg-purple-900 text-purple-300', bar: 'bg-purple-500' },
  }

  const entryCount = logs?.length || 0
  const repoCount = repos?.length || 0
  const typeBreakdown = ['decision', 'struggle', 'solved', 'learning'].map(type => ({
    type,
    count: logs?.filter(l => l.entry_type === type).length || 0,
  })).filter(t => t.count > 0)

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Profile header */}
        <div className="flex items-start gap-5 mb-10 pb-10 border-b border-gray-800">
          <img src={githubProfile.avatar_url} alt={username} className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <h1 className="text-2xl font-medium mb-1">{githubProfile.name || username}</h1>
            <p className="text-gray-400 text-sm mb-3">@{username}</p>
            {githubProfile.bio && <p className="text-gray-300 text-sm mb-3">{githubProfile.bio}</p>}
            <div className="flex gap-4 flex-wrap">
              <span className="text-xs text-gray-500">{entryCount} build log {entryCount === 1 ? 'entry' : 'entries'}</span>
              <span className="text-xs text-gray-500">{repoCount} public repos</span>
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

        {/* Build log entries */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-6">Build Log</h2>

          {!logs || logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No build log entries yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map(log => {
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
                    </div>

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
