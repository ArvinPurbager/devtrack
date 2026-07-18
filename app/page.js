'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center flex-1 flex flex-col justify-center">
        <div className="inline-block mx-auto bg-emerald-900 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
          Developer Credibility Platform
        </div>
        <h1 className="text-5xl font-medium mb-4 leading-tight">
          Prove what you actually built.
        </h1>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          DevTrack lets developers document their real build process. Companies hire based on genuine signals, not polished resumes.
        </p>
        <div className="flex gap-4 justify-center mb-16">
          <button
            onClick={() => router.push('/profile')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start logging your work
          </button>
          <button
            onClick={() => router.push('/u/ArvinPurbager')}
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View example profile
          </button>
        </div>
      </div>

      <div className="max-w-2xl w-full border-t border-gray-800 pt-8">
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-6">How it works</p>
        <div className="flex gap-6 justify-center">
          <div className="flex-1 text-center max-w-[180px]">
            <div className="text-2xl mb-2">1</div>
            <p className="text-sm text-white mb-1">Connect GitHub</p>
            <p className="text-xs text-gray-500 leading-relaxed">Sign in and pull your real commit history.</p>
          </div>
          <div className="flex-1 text-center max-w-[180px]">
            <div className="text-2xl mb-2">2</div>
            <p className="text-sm text-white mb-1">Log your thinking</p>
            <p className="text-xs text-gray-500 leading-relaxed">Capture the decisions, struggles, and fixes behind your work.</p>
          </div>
          <div className="flex-1 text-center max-w-[180px]">
            <div className="text-2xl mb-2">3</div>
            <p className="text-sm text-white mb-1">Show your growth</p>
            <p className="text-xs text-gray-500 leading-relaxed">AI scores your thinking and tracks improvement over time.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
