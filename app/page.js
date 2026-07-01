export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="inline-block bg-emerald-900 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
          Developer Credibility Platform
        </div>
        <h1 className="text-5xl font-medium mb-4 leading-tight">
          Prove what you actually built.
        </h1>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          DevTrack lets developers document their real build process. Companies hire based on genuine signals — not polished resumes.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Start logging your work
          </button>
          <button className="border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors">
            View example profile
          </button>
        </div>
      </div>
    </main>
  )
}