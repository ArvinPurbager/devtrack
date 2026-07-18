'use client'

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

export default function CodeBlock({ code, language }) {
  return (
    <SyntaxHighlighter
      language={language || 'javascript'}
      style={atomOneDark}
      customStyle={{ margin: 0, padding: '12px', fontSize: '12px', background: '#0d0d0d', maxHeight: '300px', overflowY: 'auto' }}
    >
      {code}
    </SyntaxHighlighter>
  )
}
