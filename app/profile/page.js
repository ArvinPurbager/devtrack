'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [commits, setCommits] = useState([])
  const [logs, setLogs] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    entry_type: 'decision',
    content: '',
    linked_commit_sha: '',
    is_retrospective: false,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login') } else { setUser(user) }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    fetch('/api/github/repos')
      .then(res => res.json())
      .then(data => { setRepos(data.repos || []); setLoadingRepos(false) })
  }, [user])

  function handleRepoClick(repo) {
    setSelectedRepo(repo)
    setCommits([])
    setLogs([])
    setLoadingCommits(true)
    setShowForm(false)
    fetch('/api/github/commits?repo=' + repo.full_name)
      .then(res => res.json())
      .then(data => { setCommits(data.commits || []); setLoadingCommits(false) })
    supabase
      .from('build_logs')
      .select('*')
      .eq('repo_name', repo.full_name)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLogs(data || []))
  }

  async function handleSubmit() {
    if (!form.content.trim()) return
    setSubmitting(true)

    const { data: inserted, error } = await supabase.from('build_logs').insert({
      user_id: user.id,
      repo_name: selectedRepo.full_name,
      entry_type: form.entry_type,
      content: form.content,
      linked_commit_sha: form.linked_commit_sha || null,
      is_retrospective: form.is_retrospective,
    }).select().single()

    if (!error && inserted) {
      fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: inserted.id,
          content: inserted.content,
          entry_type: inserted.entry_type,
        }),
      }).then(res => res.json()).then(({ scores }) => {
        if (scores) {
          setLogs(prev => prev.map(l => l.id === inserted.id ? { ...l, ai_scores: scores } : l))
        }
      })

      const { data } = await supabase
        .from('build_logs')
        .select('*')
        .eq('repo_name', selectedRepo.full_name)
        .order('created_at', { ascending: false })
      setLogs(data || [])
      setForm({ entry_type: 'decision', content: '', linked_commit_sha: '', is_retrospective: false })
      setShowForm(false)
    }
    setSubmitting(false)
  }

  function groupByWeek(commits, logs) {
    const groups = {}
    commits.forEach(commit => {
      const date = new Date(commit.date)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(new Date(commit.date).setDate(diff))
      const key = monday.toISOString().split('T')[0]
      if (!groups[key]) groups[key] = { commits: [], logs: [] }
      groups[key].commits.push(commit)
    })
    logs.forEach(log => {
      const date = new Date(log.created_at)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(new Date(log.created_at).setDate(diff))
      const key = monday.toISOString().split('T')[0]
      if (!groups[key]) groups[key] = { commits: [], logs: [] }
      groups[key].logs.push(log)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }

  const typeConfig = {
    struggle: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400', badge: 'bg-red-900 text-red-300', bar: 'bg-red-500', coach: 'text-red-300' },
    decision: { bg: 'bg-blue-950', border: 'border-blue-800', text: 'text-blue-400', badge: 'bg-blue-900 text-blue-300', bar: 'bg-blue-500', coach: 'text-blue-300' },
    solved: { bg: 'bg-emerald-950', border: 'border-emerald-800', text: 'text-emerald-400', badge: 'bg-emerald-900 text-emerald-300', bar: 'bg-emerald-500', coach: 'text-emerald-300' },
    learning: { bg: 'bg-purple-950', border: 'border-purple-800', text: 'text-purple-400', badge: 'bg-purple-900 text-purple-300', bar: 'bg-purple-500', coach: 'text-purple-300' },
  }

  function ScoreBar({ label, value, coachTip, barColor, coachColor }) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs opacity-60 truncate pr-2">{label}</span>
          <span className="text-xs font-semibold opacity-90 shrink-0">{value}/10</span>
        </div>
        <div className="h-1 rounded-full bg-white bg-opacity-10 mb-1.5">
          <div className={'h-1 rounded-full transition-all ' + barColor} style={{ width: (value * 10) + '%' }} />
        </div>
        {coachTip && (
          <p className={'text-xs opacity-70 ' + coachColor}>{coachTip}</p>
        )}
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-4 mb-10">
          {user.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-16 h-16 rounded-full" />
          )}
          <div>
            <h1 className="text-2xl font-medium">{user.user_metadata?.full_name || user.user_metadata?.user_name || 'Developer'}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button type="submit" className="text-gray-500 hover:text-white text-sm underline">Sign out</button>
          </form>
        </div>

        <div className="mb-10">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">Your Repositories</h2>
          {loadingRepos ? (
            <p className="text-gray-500 text-sm">Loading repos...</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {repos.map(repo => (
                <button key={repo.id} onClick={() => handleRepoClick(repo)}
                  className={'text-left px-4 py-3 rounded-lg border transition-colors ' + (selectedRepo?.id === repo.id ? 'border-emerald-600 bg-emerald-950 text-white' : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600')}>
                  <div className="font-medium text-sm">{repo.name}</div>
                  <div className="text-xs text-gray-600 mt-1">Last pushed {new Date(repo.pushed_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedRepo && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">Timeline - {selectedRepo.name}</h2>
              <button onClick={() => setShowForm(!showForm)}
                className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors">
                {showForm ? 'Cancel' : '+ Log entry'}
              </button>
            </div>

            {showForm && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-6">
                <div className="flex gap-2 mb-4 flex-wrap">
                  {['decision', 'struggle', 'solved', 'learning'].map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, entry_type: type }))}
                      className={'px-3 py-1 rounded-full text-xs font-medium border transition-colors ' + (form.entry_type === type ? typeConfig[type].badge + ' ' + typeConfig[type].border : 'border-gray-700 text-gray-500 hover:border-gray-500')}>
                      {type}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="What happened? What did you decide, struggle with, solve, or learn?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500"
                  rows={4}
                />
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <input
                    value={form.linked_commit_sha}
                    onChange={e => setForm(f => ({ ...f, linked_commit_sha: e.target.value }))}
                    placeholder="Link a commit SHA (optional)"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-gray-500 flex-1 min-w-0"
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.is_retrospective}
                      onChange={e => setForm(f => ({ ...f, is_retrospective: e.target.checked }))}
                      className="accent-emerald-500" />
                    Logging from memory
                  </label>
                  <button onClick={handleSubmit} disabled={submitting || !form.content.trim()}
                    className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    {submitting ? 'Saving...' : 'Save entry'}
                  </button>
                </div>
              </div>
            )}

            {loadingCommits ? (
              <p className="text-gray-500 text-sm">Loading timeline...</p>
            ) : (
              <div className="space-y-8">
                {groupByWeek(commits, logs).map(([weekStart, { commits: wCommits, logs: wLogs }]) => (
                  <div key={weekStart}>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                      Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="space-y-2 border-l border-gray-800 pl-4">
                      {wCommits.map(commit => (
                        <div key={commit.sha} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-white leading-snug">{commit.message}</p>
                            <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-gray-400 font-mono shrink-0">{commit.sha}</a>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                      {wLogs.map(log => {
                        const cfg = typeConfig[log.entry_type] || typeConfig.decision
                        const s = log.ai_scores
                        const m1key = s?._metric1_key
                        const m2key = s?._metric2_key
                        const m1coach = s?._metric1_coach_key
                        const m2coach = s?._metric2_coach_key
                        return (
                          <div key={log.id} className={'border rounded-xl px-4 py-4 ' + cfg.bg + ' ' + cfg.border}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={'text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ' + cfg.badge}>{log.entry_type}</span>
                              {log.is_retrospective && <span className={'text-xs opacity-50 ' + cfg.text}>(from memory)</span>}
                              {log.linked_commit_sha && <span className={'text-xs font-mono opacity-50 ' + cfg.text}>#{log.linked_commit_sha.slice(0, 7)}</span>}
                            </div>

                            <p className={'text-sm leading-relaxed mb-4 ' + cfg.text}>{log.content}</p>

                            {s && m1key && m2key ? (
                              <div className="rounded-lg p-3 bg-black bg-opacity-20 border border-white border-opacity-5 space-y-4">
                                <div className="flex gap-6">
                                  <ScoreBar
                                    label={s._metric1_label}
                                    value={s[m1key]}
                                    coachTip={m1coach ? s[m1coach] : null}
                                    barColor={cfg.bar}
                                    coachColor={cfg.coach}
                                  />
                                  <ScoreBar
                                    label={s._metric2_label}
                                    value={s[m2key]}
                                    coachTip={m2coach ? s[m2coach] : null}
                                    barColor={cfg.bar}
                                    coachColor={cfg.coach}
                                  />
                                </div>
                                <p className={'text-xs italic opacity-50 pt-1 border-t border-white border-opacity-5 ' + cfg.text}>"{s.one_line_insight}"</p>
                              </div>
                            ) : (
                              <div className="text-xs opacity-30 italic">Analyzing...</div>
                            )}

                            <p className={'text-xs opacity-40 mt-3 ' + cfg.text}>{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
