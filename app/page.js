'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GitBranch, Lightbulb, TrendingUp } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="max-w-5xl w-full mx-auto flex items-center justify-between px-4 py-6">
        <span className="text-xl font-medium text-emerald-400">Paradyx</span>
        <Button variant="outline" size="sm" onClick={() => router.push('/login')} className="bg-transparent border-gray-600 text-gray-200 hover:bg-gray-900 hover:text-white">
          Sign in
        </Button>
      </nav>

      <div className="relative max-w-2xl w-full mx-auto text-center px-4 pt-16 pb-20">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[320px] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.16)_0%,transparent_70%)]" aria-hidden="true" />
        <Badge className="relative inline-block mx-auto bg-emerald-900 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-6 tracking-widest uppercase hover:bg-emerald-900">
          Developer Credibility Platform
        </Badge>
        <h1 className="relative text-5xl font-medium mb-4 leading-tight tracking-tight bg-gradient-to-r from-white via-white to-emerald-300 bg-clip-text text-transparent">
          Prove what you actually built.
        </h1>
        <p className="relative text-gray-400 text-lg mb-8 leading-relaxed">
          Paradyx lets developers document the real thinking behind their code. Companies hire based on genuine signals, not polished resumes.
        </p>
        <div className="relative flex gap-4 justify-center">
          <Button onClick={() => router.push('/profile')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium h-auto">
            Start logging your work
          </Button>
          <Button variant="outline" onClick={() => router.push('/u/ArvinPurbager')} className="bg-transparent border-gray-500 text-gray-100 hover:bg-gray-900 hover:text-white px-6 py-3 rounded-lg font-medium h-auto">
            View example profile
          </Button>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto px-4 pb-16">
        <Separator className="bg-gray-800 mb-8" />
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-6">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-3 sm:row-span-2 bg-gray-900 border border-emerald-800/50 rounded-xl p-5 flex flex-col">
            <div className="w-9 h-9 rounded-lg bg-emerald-900/40 flex items-center justify-center mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-base text-white font-medium mb-1">Log your thinking</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Capture the decisions, struggles, and fixes behind your work — and an AI pushes back like a mentor, not a grader.
            </p>
            <div className="mt-auto bg-black/30 border border-white/5 rounded-lg px-4 py-3">
              <p className="text-sm italic text-emerald-300/90">&ldquo;What alternatives did you weigh?&rdquo;</p>
            </div>
          </div>
          <div className="sm:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-white font-medium">Connect GitHub</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Sign in and pull your real commit history.</p>
          </div>
          <div className="sm:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-white font-medium">Show your growth</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">AI scores your thinking and tracks improvement over time.</p>
          </div>
        </div>
      </div>

      <footer className="max-w-2xl w-full mx-auto px-4 pb-8 flex items-center justify-between text-sm">
        <span className="text-gray-400">Paradyx</span>
        <div className="flex gap-4">
          <a href="https://github.com/ArvinPurbager/paradyx" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
            GitHub
          </a>
          <a href="mailto:arvin@bu.edu" className="text-gray-300 hover:text-white">
            Email
          </a>
        </div>
      </footer>
    </main>
  )
}
