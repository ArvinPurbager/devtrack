import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session?.provider_token && data.session?.user) {
      await supabase.from('user_tokens').upsert({
        user_id: data.session.user.id,
        github_access_token: data.session.provider_token,
        updated_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.redirect(`${origin}/`)
}