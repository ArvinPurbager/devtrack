'use client'

import { useState } from 'react'

const PISTON_LANGUAGES = ['python', 'typescript', 'java', 'cpp', 'go', 'rust', 'bash']

export function isRunnable(language) {
  return language === 'javascript' || PISTON_LANGUAGES.includes(language)
}

function encodeCode(code) {
  return btoa(unescape(encodeURIComponent(code)))
}

function buildSrcDoc(encoded) {
  return `<!DOCTYPE html>
<html>
<head></head>
<body>
<script>
(function() {
  var logs = [];
  console.log = function() {
    var args = Array.prototype.slice.call(arguments);
    logs.push(args.map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch (e) { return String(a); }
    }).join(' '));
  };
  var error = null;
  var errorLine = null;
  try {
    var code = decodeURIComponent(escape(atob('${encoded}')));
    var fn = new Function(code);
    fn();
  } catch (e) {
    error = e.message;
    var stackLines = (e.stack || '').split(String.fromCharCode(10));
    for (var i = 0; i < stackLines.length; i++) {
      var line = stackLines[i];
      if (line.indexOf('anonymous') === -1) continue;
      var cleaned = line.replace(')', '');
      var parts = cleaned.split(':');
      if (parts.length >= 2) {
        var rawLine = parseInt(parts[parts.length - 2], 10) - 2;
        if (!isNaN(rawLine) && rawLine >= 1) errorLine = rawLine;
      }
      break;
    }
  }
  parent.postMessage({ type: 'RUN_RESULT', logs: logs.slice(), error: error, errorLine: errorLine }, '*');
})();
</script>
</body>
</html>`
}

export default function CodeRunner({ code, language = 'javascript' }) {
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)

  function runJavaScript() {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.display = 'none'

    let cleaned = false
    function cleanup() {
      if (cleaned) return
      cleaned = true
      window.removeEventListener('message', handleMessage)
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    const timeout = setTimeout(function() {
      cleanup()
      setOutput({ logs: [], error: 'Timed out (possible infinite loop)', errorLine: null })
      setRunning(false)
    }, 5000)

    function handleMessage(event) {
      if (!event.data || event.data.type !== 'RUN_RESULT') return
      clearTimeout(timeout)
      setOutput({ logs: event.data.logs, error: event.data.error, errorLine: event.data.errorLine })
      setRunning(false)
      cleanup()
    }

    window.addEventListener('message', handleMessage)

    const encoded = encodeCode(code)
    document.body.appendChild(iframe)
    iframe.srcdoc = buildSrcDoc(encoded)
  }

  async function runViaPiston() {
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOutput({ logs: [], error: data.error || 'Execution failed', errorLine: null })
        setRunning(false)
        return
      }

      const logs = []
      if (data.compileOutput) logs.push(data.compileOutput.trimEnd())
      if (data.stdout) logs.push(data.stdout.trimEnd())

      setOutput({
        logs: logs.filter(Boolean),
        error: data.stderr ? data.stderr.trimEnd() : null,
        errorLine: null,
      })
      setRunning(false)
    } catch (e) {
      setOutput({ logs: [], error: 'Could not reach execution service', errorLine: null })
      setRunning(false)
    }
  }

  function runCode() {
    setRunning(true)
    setOutput(null)
    if (language === 'javascript') {
      runJavaScript()
    } else {
      runViaPiston()
    }
  }

  if (!isRunnable(language)) return null

  return (
    <div className="mt-2">
      <button
        onClick={runCode}
        disabled={running}
        className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        {running ? 'Running...' : '\u25b6 Run'}
      </button>
      {output && (
        <div className="mt-2 bg-black rounded-lg p-3 font-mono text-xs">
          {output.logs.length > 0 && (
            <div className="text-green-400 whitespace-pre-wrap">{output.logs.join('\n')}</div>
          )}
          {output.error && (
            <div className="text-red-400 whitespace-pre-wrap mt-1">
              {output.errorLine ? `Line ${output.errorLine}: ${output.error}` : output.error}
            </div>
          )}
          {output.logs.length === 0 && !output.error && (
            <div className="text-gray-500 italic">No output</div>
          )}
        </div>
      )}
    </div>
  )
}
