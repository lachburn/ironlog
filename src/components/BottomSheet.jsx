import { useEffect, useRef } from 'react'

export default function BottomSheet({ open, onClose, children, title }) {
  const sheetRef = useRef(null)
  const startY = useRef(0)
  const dragY = useRef(0)

  if (!open) return null

  const onDragStart = (e) => {
    startY.current = e.touches[0].clientY
    dragY.current = 0
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }

  const onDragMove = (e) => {
    const delta = e.touches[0].clientY - startY.current
    if (delta <= 0) return
    dragY.current = delta
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`
  }

  const onDragEnd = () => {
    const sheet = sheetRef.current
    if (!sheet) return
    const threshold = Math.min(sheet.offsetHeight * 0.3, 160)
    if (dragY.current > threshold) {
      sheet.style.transition = 'transform 280ms ease'
      sheet.style.transform = 'translateY(100%)'
      setTimeout(onClose, 260)
    } else {
      sheet.style.transition = 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      sheet.style.transform = 'translateY(0)'
    }
    dragY.current = 0
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 80,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          animation: 'fadeIn .18s ease',
        }}
      />

      {/* Spacer pushes sheet to bottom */}
      <div style={{ flex: 1 }} />

      {/* Panel */}
      <div
        ref={sheetRef}
        style={{
          position: 'relative',
          background: 'var(--surface)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '14px 18px calc(env(safe-area-inset-bottom,0px) + 22px)',
          boxShadow: '0 -8px 30px rgba(0,0,0,.18)',
          animation: 'slideUp .22s ease',
          maxHeight: '85%',
          overflowY: 'auto',
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, cursor: 'grab' }}
        >
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--border-2)',
          }} />
        </div>

        {title && (
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 14,
            letterSpacing: '-0.01em',
          }}>
            {title}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
