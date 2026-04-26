import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, children, title }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        border: '1px solid var(--border)',
        borderBottom: 'none',
        zIndex: 50,
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'sheetUp 250ms ease',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        <style>{`
          @keyframes sheetUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
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
