import { createClient } from '@/utils/supabase/server'
import { Octokit } from 'octokit'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const repo = searchParams.get('repo') // expects "owner/reponame"

  if (!repo) {
    return NextResponse.json({ error: 'repo parameter required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: tokenRow } = await supabase
    .from('user_tokens')
    .select('github_access_token')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 })
  }

  const octokit = new Octokit({ auth: tokenRow.github_access_token })
  const [owner, repoName] = repo.split('/')

  // 90 days ago
  const since = new Date()
  since.setDate(since.getDate() - 90)

  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo: repoName,
      since: since.toISOString(),
      per_page: 100,
    })

    const simplified = commits.map(commit => ({
      sha: commit.sha.slice(0, 7), // short hash, like git shows
      message: commit.commit.message.split('\n')[0], // first line only
      date: commit.commit.author.date,
      author: commit.commit.author.name,
      url: commit.html_url,
    }))

    return NextResponse.json({ commits: simplified })
  } catch (err) {
    console.error('Commits API error:', err)
    return NextResponse.json({ error: 'Failed to fetch commits' }, { status: 500 })
  }
}