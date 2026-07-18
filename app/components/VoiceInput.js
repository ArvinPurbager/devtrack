'use client'

import { useState, useRef } from 'react'

export default function VoiceInput({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const recognitionRef = useRef(null)

  function toggle() {
    if (listening) {
      recognitionRef.current && recognitionRef.current.stop()
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setUnsupported(true)
      return
    }

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = (e) => {
      let text = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript
      }
      if (text.trim()) onTranscript(text.trim())
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  if (unsupported) {
    return <span className="text-xs text-gray-500 italic">Voice input not supported in this browser</span>
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={'text-xs px-3 py-1.5 rounded-lg border transition-colors ' + (listening
        ? 'bg-red-900 border-red-700 text-red-300 animate-pulse'
        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white')}
    >
      {listening ? '\u23f9 Stop dictating' : '\ud83c\udf99 Dictate'}
    </button>
  )
}
