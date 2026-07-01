import { createClient } from '@/utils/supabase/server'
import { Octokit } from 'octokit'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // 1. Make sure the user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Get their GitHub token from the database
  const { data: tokenRow, error: tokenError } = await supabase
    .from('user_tokens')
    .select('github_access_token')
    .eq('user_id', user.id)
    .single()

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'GitHub token not found. Please sign out and sign back in.' }, { status: 400 })
  }

  // 3. Use the token to call GitHub via Octokit
  const octokit = new Octokit({ auth: tokenRow.github_access_token })

  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'pushed',       // most recently active first
      per_page: 50,         // grab up to 50 repos
      visibility: 'all', // public repos only for now
    })

    // 4. Return only the fields we actually need (don't leak unnecessary data)
    const simplified = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      pushed_at: repo.pushed_at,
      html_url: repo.html_url,
    }))
    
    return NextResponse.json({ repos: simplified })
  } catch (err) {
    console.error('GitHub API error:', err)
    return NextResponse.json({ error: 'Failed to fetch repos from GitHub' }, { status: 500 })
  }
}