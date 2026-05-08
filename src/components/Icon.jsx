// Custom SVG icon set — replaces every emoji in the original app.
// All use currentColor so they inherit the surrounding ink.

export function Icon({ name, size = 20, stroke = 1.6, style }) {
  const s = size, sw = stroke;
  const common = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round',
    strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'home':       return <svg {...common}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case 'dumbbell':   return <svg {...common}><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/></svg>;
    case 'list':       return <svg {...common}><path d="M4 6h16M4 12h16M4 18h10"/></svg>;
    case 'chart':      return <svg {...common}><path d="M3 20h18"/><path d="M6 16V9M11 16V5M16 16v-7M21 16v-3"/></svg>;
    case 'plus':       return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':      return <svg {...common}><path d="M5 12h14"/></svg>;
    case 'check':      return <svg {...common}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
    case 'x':          return <svg {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'chev-r':     return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chev-l':     return <svg {...common}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chev-up':    return <svg {...common}><path d="M6 15l6-6 6 6"/></svg>;
    case 'chev-down':  return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'arrow-r':    return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-l':    return <svg {...common}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'cog':        return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case 'trash':      return <svg {...common}><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/></svg>;
    case 'edit':       return <svg {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'search':     return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'play':       return <svg {...common}><path d="M7 4l13 8-13 8V4z" fill="currentColor" stroke="none"/></svg>;
    case 'pause':      return <svg {...common}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/></svg>;
    case 'flame':      return <svg {...common}><path d="M12 3s4 4 4 8a4 4 0 11-8 0c0-2 1.5-3.5 1.5-5.5"/><path d="M9 17a3 3 0 006 0"/></svg>;
    case 'calendar':   return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
    case 'mail':       return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
    case 'log-out':    return <svg {...common}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'sun':        return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    case 'moon':       return <svg {...common}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>;
    case 'sparkle':    return <svg {...common}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/></svg>;
    case 'rotate':     return <svg {...common}><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/></svg>;
    case 'eye':        return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'timer':      return <svg {...common}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>;
    case 'link':       return <svg {...common}><path d="M10 14a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1 1"/><path d="M14 10a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1-1"/></svg>;
    case 'user':       return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>;
    case 'trophy':     return <svg {...common}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3v3a3 3 0 01-3 3M7 5H4v3a3 3 0 003 3"/></svg>;
    default:           return null;
  }
}

export default Icon;
