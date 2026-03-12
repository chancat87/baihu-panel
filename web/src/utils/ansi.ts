import AnsiUp from 'ansi-to-html'

const ansiUp = new AnsiUp({
  newline: false,
  escapeXML: true,
  stream: false,
  colors: {
    // 基础 16 色优化，使其在深色背景下更鲜艳
    0:  '#000000', // Black
    1:  '#ef4444', // Red (Tailwind red-500)
    2:  '#22c55e', // Green (Tailwind green-500)
    3:  '#eab308', // Yellow (Tailwind yellow-500)
    4:  '#3b82f6', // Blue (Tailwind blue-500)
    5:  '#a855f7', // Magenta (Tailwind purple-500)
    6:  '#06b6d4', // Cyan (Tailwind cyan-500)
    7:  '#d4d4d8', // White (Tailwind zinc-300)
    8:  '#71717a', // Bright Black
    9:  '#f87171', // Bright Red
    10: '#4ade80', // Bright Green
    11: '#facc15', // Bright Yellow
    12: '#60a5fa', // Bright Blue
    13: '#c084fc', // Bright Magenta
    14: '#22d3ee', // Bright Cyan
    15: '#ffffff'  // Bright White
  }
})

export function ansiToHtml(ansi: string): string {
  if (!ansi) return ''
  return ansiUp.toHtml(ansi)
}

export function highlightHtml(html: string, keyword: string): string {
  if (!keyword.trim()) return html
  
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Match keyword but not inside HTML tags
  const regex = new RegExp(`(${escaped})(?![^<]*>)`, 'gi')
  return html.replace(regex, '<mark class="bg-yellow-300 text-black">$1</mark>')
}
