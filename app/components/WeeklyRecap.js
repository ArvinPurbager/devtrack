'use client'

function startOfDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export default function WeeklyRecap({ logs }) {
  if (!logs || logs.length === 0) return null

  const now = new Date()
  const sevenDaysAgo = startOfDaysAgo(7)
  const fourteenDaysAgo = startOfDaysAgo(14)

  const thisWeek = logs.filter(l => {
    const d = new Date(l.created_at)
    return d >= sevenDaysAgo && d <= now
  })
  const lastWeek = logs.filter(l => {
    const d = new Date(l.created_at)
    return d >= fourteenDaysAgo && d < sevenDaysAgo
  })

  function avgScore(entries) {
    const scored = entries.filter(l => l.ai_scores && l.ai_scores._metric1_key && l.ai_scores._metric2_key)
    if (scored.length === 0) return null
    let total = 0
    for (const l of scored) {
      const s = l.ai_scores
      total += (s[s._metric1_key] + s[s._metric2_key]) / 2
    }
    return Math.round((total / scored.length) * 10) / 10
  }

  const thisCount = thisWeek.length
  const lastCount = lastWeek.length
  const countDelta = thisCount - lastCount

  const thisAvg = avgScore(thisWeek)
  const lastAvg = avgScore(lastWeek)
  const avgDelta = (thisAvg !== null && lastAvg !== null) ? Math.round((thisAvg - lastAvg) * 10) / 10 : null

  function typeAvg(entries, type) {
    const scored = entries.filter(l => l.entry_type === type && l.ai_scores && l.ai_scores._metric1_key && l.ai_scores._metric2_key)
    if (scored.length === 0) return null
    let total = 0
    for (const l of scored) {
      const s = l.ai_scores
      total += (s[s._metric1_key] + s[s._metric2_key]) / 2
    }
    return total / scored.length
  }

  const typeAverages = ['decision', 'struggle', 'solved']
    .map(type => ({ type, avg: typeAvg(thisWeek, type) }))
    .filter(t => t.avg !== null)

  let bestType = null
  let worstType = null
  if (typeAverages.length >= 2) {
    const sorted = [...typeAverages].sort((a, b) => b.avg - a.avg)
    bestType = sorted[0].type
    worstType = sorted[sorted.length - 1].type
  }

  const typeCounts = ['decision', 'struggle', 'solved'].map(type => ({
    type,
    count: thisWeek.filter(l => l.entry_type === type).length,
  })).filter(t => t.count > 0)

  const typeColor = {
    decision: 'text-blue-400',
    struggle: 'text-red-400',
    solved: 'text-emerald-400',
  }

  return (
    <div className="mb-10 bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">This week</h2>

      <div className="flex flex-wrap gap-8">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium text-white">{thisCount}</span>
            <span className="text-sm text-gray-500">{thisCount === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="text-xs mt-1">
            {countDelta > 0 && <span className="text-emerald-400">+{countDelta} vs last week</span>}
            {countDelta < 0 && <span className="text-red-400">{countDelta} vs last week</span>}
            {countDelta === 0 && <span className="text-gray-500">same as last week</span>}
          </div>
        </div>

        {thisAvg !== null && (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-white">{thisAvg}</span>
              <span className="text-sm text-gray-500">avg score</span>
            </div>
            <div className="text-xs mt-1">
              {avgDelta === null && <span className="text-gray-500">no prior week to compare</span>}
              {avgDelta !== null && avgDelta > 0 && <span className="text-emerald-400">+{avgDelta} vs last week</span>}
              {avgDelta !== null && avgDelta < 0 && <span className="text-red-400">{avgDelta} vs last week</span>}
              {avgDelta !== null && avgDelta === 0 && <span className="text-gray-500">steady vs last week</span>}
            </div>
          </div>
        )}

        {typeCounts.length > 0 && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Breakdown</div>
            <div className="flex gap-3">
              {typeCounts.map(t => (
                <span key={t.type} className={'text-sm ' + typeColor[t.type]}>
                  {t.count} {t.type}
                </span>
              ))}
            </div>
          </div>
        )}

        {bestType && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Strongest</div>
            <span className={'text-lg font-medium capitalize ' + typeColor[bestType]}>{bestType}</span>
          </div>
        )}

        {worstType && bestType !== worstType && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Needs work</div>
            <span className={'text-lg font-medium capitalize ' + typeColor[worstType]}>{worstType}</span>
          </div>
        )}
      </div>

      {thisCount === 0 && (
        <p className="text-sm text-gray-500 mt-2">No entries in the last 7 days. Log something to keep your momentum.</p>
      )}
    </div>
  )
}
