'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SignupPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSignup() {
    setError('')

    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername || !/^[a-z0-9_-]{3,30}$/.test(cleanUsername)) {
      setError('Username must be 3-30 characters: letters, numbers, hyphens, underscores.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('github_username', cleanUsername)
      .maybeSingle()

    if (existing) {
      setError('That username is already taken.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { pending_username: cleanUsername },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to home
        </a>
          <h1 className="text-2xl font-medium mb-3">Check your email</h1>
          <p className="text-gray-400 text-sm mb-2">
            We sent a confirmation link to <span className="text-white">{email}</span>.
          </p>
          <p className="text-gray-500 text-sm">
            Click it to finish setting up your account.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-medium mb-2 text-center">Create your account</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Start building your developer credibility profile.
        </p>

        <div className="relative mb-6">
          <div className="space-y-3 opacity-40 pointer-events-none select-none">
            <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500">Username (your profile URL)</div>
            <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500">you@email.com</div>
            <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-500">Password (8+ characters)</div>
            <div className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium text-center">Create account</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest text-gray-400 bg-gray-950 px-3 py-1 rounded-full border border-gray-700">Email accounts coming soon</span>
          </div>
        </div>

        <a href="/login" className="block w-full bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center">
          Continue with GitHub
        </a>
      </div>
    </main>
  )
}
