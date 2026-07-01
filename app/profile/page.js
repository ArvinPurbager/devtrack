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
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [loadingCommits, setLoadingCommits] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login') } else { setUser(user) }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    setLoadingRepos(true)
    fetch('/api/github/repos')
      .then(res => res.json())
      .then(data => { setRepos(data.repos || []); setLoadingRepos(false) })
  }, [user])

  function handleRepoClick(repo) {
    setSelectedRepo(repo)
    setCommits([])
    setLoadingCommits(true)
    fetch('/api/github/commits?repo=' + repo.full_name)
      .then(res => res.json())
      .then(data => { setCommits(data.commits || []); setLoadingCommits(false) })
  }

  function groupByWeek(commits) {
    const groups = {}
    commits.forEach(commit => {
      const date = new Date(commit.date)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(date.setDate(diff))
      const key = monday.toISOString().split('T')[0]
      if (!groups[key]) groups[key] = []
      groups[key].push(commit)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
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
            <h1 className="text-2xl font-medium">
              {user.user_metadata?.full_name || user.user_metadata?.user_name || 'Developer'}
            </h1>
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
          ) : repos.length === 0 ? (
            <p className="text-gray-500 text-sm">No repositories found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {repos.map(repo => (
                <button key={repo.id} onClick={() => handleRepoClick(repo)}
                  className={'text-left px-4 py-3 rounded-lg border transition-colors ' + (selectedRepo?.id === repo.id ? 'border-emerald-600 bg-emerald-950 text-white' : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600')}>
                  <div className="font-medium text-sm">{repo.name}</div>
                  {repo.description && <div className="text-xs text-gray-500 mt-1">{repo.description}</div>}
                  <div className="text-xs text-gray-600 mt-1">
                    {repo.language && <span className="mr-3">{repo.language}</span>}
                    Last pushed {new Date(repo.pushed_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedRepo && (
          <div>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
              Commit Timeline - {selectedRepo.name}
            </h2>
            {loadingCommits ? (
              <p className="text-gray-500 text-sm">Loading commits...</p>
            ) : commits.length === 0 ? (
              <p className="text-gray-500 text-sm">No commits in the last 90 days.</p>
            ) : (
              <div className="space-y-8">
                {groupByWeek(commits).map(([weekStart, weekCommits]) => (
                  <div key={weekStart}>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                      Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="space-y-2 border-l border-gray-800 pl-4">
                      {weekCommits.map(commit => (
                        <div key={commit.sha} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-white leading-snug">{commit.message}</p>
                            <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-gray-400 font-mono shrink-0">{commit.sha}</a>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
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
