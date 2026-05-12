import { DEV_STORE } from './mockData.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function resolveJoins(row, table, selectStr) {
  const joined = { ...row }
  // Allow optional whitespace between table name and opening paren
  const joinRe = /(\w+)\s*\(([^)]*)\)/g
  let m
  while ((m = joinRe.exec(selectStr)) !== null) {
    const joinTable = m[1]
    const innerCols = m[2]
    if (table === 'routines' && joinTable === 'routine_exercises') {
      let relRows = (DEV_STORE.routine_exercises || []).filter(re => re.routine_id === row.id)
      if (/exercises\s*\(/.test(innerCols)) {
        relRows = relRows.map(re => {
          const ex = (DEV_STORE.exercises || []).find(e => e.id === re.exercise_id)
          return { ...re, exercises: ex ? { id: ex.id, name: ex.name, type: ex.type } : null }
        })
      }
      relRows.sort((a, b) => a.display_order - b.display_order)
      joined.routine_exercises = relRows
    } else if (table === 'workout_sessions' && joinTable === 'routines') {
      const routine = (DEV_STORE.routines || []).find(r => r.id === row.routine_id)
      joined.routines = routine ? { emoji: routine.emoji } : null
    }
  }
  return joined
}

class QueryBuilder {
  constructor(table) {
    this._table = table
    this._op = 'select'
    this._filters = []
    this._orderCol = null
    this._orderAsc = true
    this._limitN = null
    this._selectCols = '*'
    this._payload = null
    this._isSingle = false
  }

  select(cols = '*') { this._selectCols = cols; return this }
  eq(col, val)       { this._filters.push(['eq', col, val]); return this }
  not(col, op, val)  { this._filters.push(['not', col, op, val]); return this }
  in(col, arr)       { this._filters.push(['in', col, arr]); return this }
  ilike(col, pat)    { this._filters.push(['ilike', col, pat]); return this }
  order(col, opts)   { this._orderCol = col; this._orderAsc = (opts || {}).ascending !== false; return this }
  limit(n)           { this._limitN = n; return this }
  single()           { this._isSingle = true; return this }

  insert(data) { this._op = 'insert'; this._payload = data; return this }
  update(data) { this._op = 'update'; this._payload = data; return this }
  delete()     { this._op = 'delete'; return this }

  then(resolve) { resolve(this._execute()) }

  _applyFilters(rows) {
    for (const f of this._filters) {
      const [type, col] = f
      if (type === 'eq')    rows = rows.filter(r => r[col] === f[2])
      else if (type === 'not' && f[2] === 'is' && f[3] === null)
        rows = rows.filter(r => r[col] !== null && r[col] !== undefined)
      else if (type === 'in')    rows = rows.filter(r => f[2].includes(r[col]))
      else if (type === 'ilike') {
        const re = new RegExp(f[2].replace(/%/g, '.*'), 'i')
        rows = rows.filter(r => re.test(r[col] ?? ''))
      }
    }
    return rows
  }

  _matchesFilters(row) {
    for (const f of this._filters) {
      const [type, col] = f
      if (type === 'eq' && row[col] !== f[2]) return false
      if (type === 'in' && !f[2].includes(row[col])) return false
    }
    return true
  }

  _execute() {
    if (!DEV_STORE[this._table]) DEV_STORE[this._table] = []
    const table = DEV_STORE[this._table]

    if (this._op === 'insert') {
      const rows = Array.isArray(this._payload) ? this._payload : [this._payload]
      const inserted = rows.map(r => {
        const row = { id: uid(), created_at: new Date().toISOString(), ...r }
        DEV_STORE[this._table].push(row)
        return row
      })
      if (this._isSingle) return { data: inserted[0] ?? null, error: null }
      return { data: inserted, error: null }
    }

    if (this._op === 'update') {
      DEV_STORE[this._table] = table.map(r =>
        this._matchesFilters(r) ? { ...r, ...this._payload } : r
      )
      return { data: null, error: null }
    }

    if (this._op === 'delete') {
      DEV_STORE[this._table] = table.filter(r => !this._matchesFilters(r))
      return { data: null, error: null }
    }

    // select
    const hasJoins = /\w+\s*\(/.test(this._selectCols)
    let rows = this._applyFilters([...table])
    if (hasJoins) rows = rows.map(r => resolveJoins(r, this._table, this._selectCols))

    if (this._orderCol) {
      const col = this._orderCol
      const asc = this._orderAsc
      rows.sort((a, b) => {
        const av = a[col] ?? '', bv = b[col] ?? ''
        return asc ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
      })
    }
    if (this._limitN != null) rows = rows.slice(0, this._limitN)
    if (this._isSingle) return { data: rows[0] ?? null, error: null }
    return { data: rows, error: null }
  }
}

export const mockSupabase = {
  from: (table) => new QueryBuilder(table),
  auth: {
    getSession:          async () => ({ data: { session: null } }),
    onAuthStateChange:   ()       => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOtp:       async () => ({ error: null }),
    verifyOtp:           async () => ({ data: { user: null }, error: null }),
    signOut:             async () => {},
  },
}
