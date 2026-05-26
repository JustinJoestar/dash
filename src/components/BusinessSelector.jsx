import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Settings, Check } from 'lucide-react'
import { useBusiness } from '../App'
import BusinessModal from './BusinessModal'

export default function BusinessSelector() {
  const { businesses, activeBusiness, setActiveBusiness, refreshBusinesses } = useBusiness()
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSaved() {
    setModal(null)
    refreshBusinesses()
  }

  return (
    <div className="relative mt-1" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 py-1 rounded-md text-left transition-colors hover:bg-white/5 group"
      >
        <span className="flex-1 truncate text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
          {activeBusiness?.name ?? <span className="text-slate-500 font-normal italic">No business</span>}
        </span>
        <ChevronDown size={11} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
          {businesses.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-500 text-center">No businesses yet.</p>
          ) : (
            businesses.map(biz => (
              <div key={biz.id} className="flex items-center group/row">
                <button
                  onClick={() => { setActiveBusiness(biz); setOpen(false) }}
                  className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <Check size={11} className={`shrink-0 ${activeBusiness?.id === biz.id ? 'text-emerald-400' : 'invisible'}`} />
                  <span className={`truncate text-xs ${activeBusiness?.id === biz.id ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {biz.name}
                  </span>
                </button>
                <button
                  onClick={() => { setModal(biz); setOpen(false) }}
                  title="Edit"
                  className="px-2.5 py-2 text-slate-600 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover/row:opacity-100"
                >
                  <Settings size={11} />
                </button>
              </div>
            ))
          )}
          <div className="border-t border-white/5">
            <button
              onClick={() => { setModal('new'); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Plus size={11} />
              New Business
            </button>
          </div>
        </div>
      )}

      {modal !== null && (
        <BusinessModal
          business={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
