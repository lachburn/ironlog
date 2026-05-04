import { useEffect, useRef } from 'react'

export default function BottomSheet({ open, onClose, children, title }) {
  const sheetRef = useRef(null)
  const startY = useRef(0)
  const dragY = useRef(0)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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
    <>
      <div className="backdrop" onClick={onClose} style={{ zIndex: 105 }} />
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid var(--border)',
          borderBottom: 'none',
          zIndex: 110,
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sheetUp 250ms ease',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          willChange: 'transform',
        }}
      >
        <style>{`
          @keyframes sheetUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>

        {/* Drag handle — enlarged touch target for swipe-to-dismiss */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px', cursor: 'grab' }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {title && (
          <div style={{
            padding: '0 20px 16px',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border)',
          }}>
            {title}
          </div>
        )}

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  )
}
