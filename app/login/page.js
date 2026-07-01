'use client'

import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function handleGitHubLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'public_repo read:user',  // ADD THIS LINE
      },
    })
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-2xl font-medium mb-2">Sign in to DevTrack</h1>
        <p className="text-gray-400 text-sm mb-8">
          Connect your GitHub account to start logging your work.
        </p>
        <button
          onClick={handleGitHubLogin}
          className="w-full bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Continue with GitHub
        </button>
      </div>
    </main>
  )
}