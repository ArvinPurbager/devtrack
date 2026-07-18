import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session?.user) {
      const user = data.session.user

      if (data.session.provider_token) {
        await supabase.from('user_tokens').upsert({
          user_id: user.id,
          github_access_token: data.session.provider_token,
          updated_at: new Date().toISOString(),
        })

        const githubUsername = user.user_metadata?.user_name
        if (githubUsername) {
          await supabase.from('profiles').upsert({
            user_id: user.id,
            github_username: githubUsername,
            auth_type: 'github',
            updated_at: new Date().toISOString(),
          })
        }
      } else if (user.user_metadata?.pending_username) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            user_id: user.id,
            github_username: user.user_metadata.pending_username,
            auth_type: 'email',
            updated_at: new Date().toISOString(),
          })
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/profile`)
}
