import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import SummaryPanel from './components/SummaryPanel'
import CurrencyConverter from './components/CurrencyConverter'
import Aurora from './components/Aurora'
import ColorBends from './components/ColorBends'
import BudgetPlanner from './components/BudgetPlanner'
import SpendingTrends from './components/SpendingTrends'
import InsightsPanel from './components/InsightsPanel'
import { getExpenseTimestamp, parseExpenseDate } from './utils/date'

const STORAGE_KEY = 'expense-tracker:v1'
const BUDGET_KEY = 'expense-tracker:budget'

const CATEGORIES = ['Food', 'Travel', 'Marketing', 'Utilities', 'Other']

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' },
  { value: 'name-asc', label: 'Name (A-Z)' },
]

const BASE_CURRENCY = 'USD'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `exp_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function loadExpenses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadBudget() {
  try {
    const stored = localStorage.getItem(BUDGET_KEY)
    if (!stored) return null
    const value = Number(stored)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function formatDayKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getRecentDays(expenses, days) {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))

  const buckets = new Map()
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = formatDayKey(date)
    buckets.set(key, {
      key,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      shortLabel: formatter.format(date),
      amount: 0,
    })
  }

  expenses.forEach((expense) => {
    const parsed = parseExpenseDate(expense.date)
    if (!parsed) return
    parsed.setHours(0, 0, 0, 0)
    const key = formatDayKey(parsed)
    const bucket = buckets.get(key)
    if (bucket) bucket.amount += expense.amount
  })

  return Array.from(buckets.values())
}


function App() {
  const [expenses, setExpenses] = useState(loadExpenses)
  const [budget, setBudget] = useState(loadBudget)
  const [filters, setFilters] = useState({
    query: '',
    category: 'All',
    minAmount: '',
    maxAmount: '',
    sort: 'date-desc',
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    } catch {
      // Ignore storage write failures so the UI keeps working.
    }
  }, [expenses])

  useEffect(() => {
    try {
      if (!budget) {
        localStorage.removeItem(BUDGET_KEY)
      } else {
        localStorage.setItem(BUDGET_KEY, String(budget))
      }
    } catch {
      // Ignore storage write failures so the UI keeps working.
    }
  }, [budget])

  const formatCurrency = useCallback((value, currency = BASE_CURRENCY) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '--'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  }, [])

  const filteredExpenses = useMemo(() => {
    let result = [...expenses]
    const query = filters.query.trim().toLowerCase()
    if (query) {
      result = result.filter((expense) =>
        `${expense.name} ${expense.category}`.toLowerCase().includes(query),
      )
    }
    if (filters.category !== 'All') {
      result = result.filter((expense) => expense.category === filters.category)
    }
    const minAmount = Number(filters.minAmount)
    const maxAmount = Number(filters.maxAmount)
    if (!Number.isNaN(minAmount) && filters.minAmount !== '') {
      result = result.filter((expense) => expense.amount >= minAmount)
    }
    if (!Number.isNaN(maxAmount) && filters.maxAmount !== '') {
      result = result.filter((expense) => expense.amount <= maxAmount)
    }

    switch (filters.sort) {
      case 'date-asc':
        result.sort((a, b) => getExpenseTimestamp(a.date) - getExpenseTimestamp(b.date))
        break
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount)
        break
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount)
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date-desc':
      default:
        result.sort((a, b) => getExpenseTimestamp(b.date) - getExpenseTimestamp(a.date))
    }

    return result
  }, [expenses, filters])

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0)
    const count = expenses.length
    const largest = expenses.reduce((max, item) => Math.max(max, item.amount), 0)
    const average = count ? total / count : 0
    const now = new Date()
    const monthTotal = expenses
      .filter((item) => {
        const date = parseExpenseDate(item.date)
        return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
      })
      .reduce((sum, item) => sum + item.amount, 0)

    const byCategory = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount
      return acc
    }, {})

    const categoryTotals = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    return {
      total,
      count,
      largest,
      average,
      monthTotal,
      categoryTotals,
    }
  }, [expenses])

  const recentWeek = useMemo(() => getRecentDays(expenses, 7), [expenses])
  const recentMonth = useMemo(() => getRecentDays(expenses, 30), [expenses])

  const insights = useMemo(() => {
    const topCategory = summary.categoryTotals[0]
    const topDay = recentMonth.reduce(
      (max, item) => (item.amount > max.amount ? item : max),
      { amount: 0 },
    )
    const averageDaily = recentMonth.reduce((sum, item) => sum + item.amount, 0) / 30

    return {
      topCategory: topCategory?.category ?? null,
      topCategoryAmount: topCategory?.amount ?? 0,
      topDayLabel: topDay.amount > 0 ? topDay.label : null,
      topDayAmount: topDay.amount ?? 0,
      averageDaily,
    }
  }, [summary.categoryTotals, recentMonth])

  const handleAddExpense = useCallback((payload) => {
    setExpenses((prev) => [
      {
        id: createId(),
        name: payload.name,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
        note: payload.note,
      },
      ...prev,
    ])
  }, [])

  const handleRemoveExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id))
  }, [])


  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true">
        <ColorBends
          colors={['#f7a35c', '#3dd3c8', '#0f766e']}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1.1}
          mouseInfluence={0.6}
          noise={0.1}
          parallax={0.4}
          iterations={2}
          intensity={1.4}
          bandWidth={6}
          transparent
        />
        <div className="app-background-overlay" />
      </div>
      <Navbar />
      <main className="app-main">
        <section className="hero">
          <div className="hero-aurora">
            <Aurora
              colorStops={['#9ef6d4', '#7bd4c6', '#1f8f88']}
              blend={0.55}
              amplitude={1.0}
              speed={0.6}
            />
          </div>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">Expense Tracker</p>
            <h1>Clarity for everyday spending.</h1>
            <p className="hero-subtitle">
              Track expenses, spot patterns, and keep your budget honest with a premium,
              streamlined ledger.
            </p>
            <div className="hero-metrics">
              <div>
                <span>Total spend</span>
                <strong>{formatCurrency(summary.total)}</strong>
                <small>All time</small>
              </div>
              <div>
                <span>This month</span>
                <strong>{formatCurrency(summary.monthTotal)}</strong>
                <small>Current cycle</small>
              </div>
              <div>
                <span>Transactions</span>
                <strong>{summary.count}</strong>
                <small>Tracked so far</small>
              </div>
            </div>
          </div>
        </section>

        <SummaryPanel summary={summary} formatCurrency={formatCurrency} />

        <section className="insights-layout">
          <BudgetPlanner budget={budget} onBudgetChange={setBudget} spent={summary.monthTotal} formatCurrency={formatCurrency} />
          <SpendingTrends days={recentWeek} formatCurrency={formatCurrency} />
          <InsightsPanel insights={insights} formatCurrency={formatCurrency} />
        </section>

        <section className="app-grid">
          <div className="stack">
            <ExpenseForm categories={CATEGORIES} onAddExpense={handleAddExpense} />
            <CurrencyConverter amount={summary.total} baseCurrency={BASE_CURRENCY} />
          </div>
          <ExpenseList
            items={filteredExpenses}
            filters={filters}
            onFiltersChange={setFilters}
            onRemoveExpense={handleRemoveExpense}
            categories={CATEGORIES}
            sortOptions={SORT_OPTIONS}
            formatCurrency={formatCurrency}
          />
        </section>
      </main>
    </div>
  )
}

export default App
