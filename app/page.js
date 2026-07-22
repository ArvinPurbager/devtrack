'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GitBranch, Lightbulb, TrendingUp } from 'lucide-react'

const steps = [
  { icon: GitBranch, title: 'Connect GitHub', description: 'Sign in and pull your real commit history.' },
  { icon: Lightbulb, title: 'Log your thinking', description: 'Capture the decisions, struggles, and fixes behind your work.' },
  { icon: TrendingUp, title: 'Show your growth', description: 'AI scores your thinking and tracks improvement over time.' },
]

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

      <div className="max-w-2xl w-full mx-auto text-center px-4 pt-16 pb-20">
        <Badge className="inline-block mx-auto bg-emerald-900 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-6 tracking-widest uppercase hover:bg-emerald-900">
          Developer Credibility Platform
        </Badge>
        <h1 className="text-5xl font-medium mb-4 leading-tight">
          Prove what you actually built.
        </h1>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          Paradyx lets developers document the real thinking behind their code. Companies hire based on genuine signals, not polished resumes.
        </p>
        <div className="flex gap-4 justify-center">
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
        <div className="flex gap-4 justify-center">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card key={step.title} className="flex-1 max-w-[200px] bg-transparent border-gray-800 text-center">
                <CardContent className="pt-6 pb-5 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-900/40 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm text-white mb-1">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <footer className="max-w-2xl w-full mx-auto px-4 pb-8 flex items-center justify-between text-sm">
        <span className="text-gray-400">Paradyx</span>
        <div className="flex gap-4">
          <a href="https://github.com/ArvinPurbager/devtrack" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
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
