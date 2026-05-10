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
const FRANKFURTER_API = 'https://api.frankfurter.dev/v2'

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
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => {
        const amount = Number(entry?.amount)
        return {
          ...entry,
          amount: Number.isFinite(amount) ? amount : 0,
          currency: entry?.currency || BASE_CURRENCY,
        }
      })
      .filter((entry) => entry && typeof entry === 'object')
  } catch {
    return []
  }
}

function loadBudget() {
  try {
    const stored = localStorage.getItem(BUDGET_KEY)
    if (!stored) return null
    let parsed
    try {
      parsed = JSON.parse(stored)
    } catch {
      parsed = null
    }

    if (parsed && typeof parsed === 'object') {
      const value = Number(parsed.amount)
      if (!Number.isFinite(value) || value <= 0) return null
      return {
        amount: Number(value.toFixed(2)),
        currency: parsed.currency || BASE_CURRENCY,
      }
    }

    const value = Number(stored)
    if (!Number.isFinite(value) || value <= 0) return null
    return {
      amount: Number(value.toFixed(2)),
      currency: BASE_CURRENCY,
    }
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
    const amount = expense.displayAmount
    if (bucket && Number.isFinite(amount)) bucket.amount += amount
  })

  return Array.from(buckets.values())
}


function App() {
  const [expenses, setExpenses] = useState(loadExpenses)
  const [budget, setBudget] = useState(loadBudget)
  const [displayCurrency, setDisplayCurrency] = useState(BASE_CURRENCY)
  const [rateRefreshKey, setRateRefreshKey] = useState(0)
  const [rateState, setRateState] = useState({
    rates: { [BASE_CURRENCY]: 1 },
    currencies: [],
    rateDate: '',
    status: 'loading',
    error: '',
  })
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
      if (!budget || !budget.amount) {
        localStorage.removeItem(BUDGET_KEY)
      } else {
        localStorage.setItem(
          BUDGET_KEY,
          JSON.stringify({
            amount: budget.amount,
            currency: budget.currency || BASE_CURRENCY,
          }),
        )
      }
    } catch {
      // Ignore storage write failures so the UI keeps working.
    }
  }, [budget])

  useEffect(() => {
    const controller = new AbortController()

    const fetchRates = async () => {
      try {
        setRateState({
          rates: { [displayCurrency]: 1 },
          currencies: [],
          rateDate: '',
          status: 'loading',
          error: '',
        })

        const [ratesResponse, currenciesResponse] = await Promise.all([
          fetch(`${FRANKFURTER_API}/rates?base=${displayCurrency}`, { signal: controller.signal }),
          fetch(`${FRANKFURTER_API}/currencies`, { signal: controller.signal }),
        ])

        if (!ratesResponse.ok || !currenciesResponse.ok) {
          throw new Error('Unable to fetch rates')
        }

        const ratesData = await ratesResponse.json()
        const currenciesData = await currenciesResponse.json()

        const nextRates = ratesData.reduce(
          (acc, entry) => {
            if (entry?.quote && Number.isFinite(entry.rate)) {
              acc[entry.quote] = entry.rate
            }
            return acc
          },
          { [displayCurrency]: 1 },
        )

        const currencyCodes = currenciesData
          .map((entry) => entry?.iso_code)
          .filter((code) => typeof code === 'string' && code)

        setRateState({
          rates: nextRates,
          currencies: currencyCodes,
          rateDate: ratesData[0]?.date || 'Live',
          status: 'ready',
          error: '',
        })
      } catch (err) {
        if (err.name === 'AbortError') return
        setRateState({
          rates: { [displayCurrency]: 1 },
          currencies: [],
          rateDate: '',
          status: 'error',
          error: 'Unable to load live rates right now.',
        })
      }
    }

    fetchRates()
    return () => controller.abort()
  }, [displayCurrency, rateRefreshKey])

  const { rates, currencies, rateDate, status: rateStatus, error: rateError } = rateState

  const availableCurrencies = useMemo(() => {
    const known = new Set(
      currencies.filter((code) => Boolean(code) && (rates[code] || code === displayCurrency)),
    )
    if (rates.INR || displayCurrency === 'INR') known.add('INR')
    if (displayCurrency) known.add(displayCurrency)
    const codes = Array.from(known)
    const remainder = codes
      .filter((code) => code !== 'INR')
      .sort((left, right) => left.localeCompare(right))

    return known.has('INR') ? ['INR', ...remainder] : remainder
  }, [currencies, displayCurrency, rates])

  const convertToDisplay = useCallback(
    (amount, fromCurrency) => {
      if (!Number.isFinite(amount)) return null
      const source = fromCurrency || BASE_CURRENCY
      if (source === displayCurrency) return amount
      if (rateStatus !== 'ready') return null
      const rate = rates[source]
      if (!Number.isFinite(rate) || rate === 0) return null
      return amount / rate
    },
    [displayCurrency, rateStatus, rates],
  )

  const formatCurrency = useCallback((value, currency = displayCurrency) => {
    if (!Number.isFinite(value)) return '--'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  }, [displayCurrency])

  const expensesWithDisplay = useMemo(
    () =>
      expenses.map((expense) => {
        const currency = expense.currency || BASE_CURRENCY
        const displayAmount = convertToDisplay(expense.amount, currency)
        return { ...expense, currency, displayAmount }
      }),
    [convertToDisplay, expenses],
  )

  const budgetDisplayAmount = useMemo(() => {
    if (!budget) return null
    return convertToDisplay(budget.amount, budget.currency || BASE_CURRENCY)
  }, [budget, convertToDisplay])

  const filteredExpenses = useMemo(() => {
    let result = [...expensesWithDisplay]
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
      result = result.filter(
        (expense) => Number.isFinite(expense.displayAmount) && expense.displayAmount >= minAmount,
      )
    }
    if (!Number.isNaN(maxAmount) && filters.maxAmount !== '') {
      result = result.filter(
        (expense) => Number.isFinite(expense.displayAmount) && expense.displayAmount <= maxAmount,
      )
    }

    switch (filters.sort) {
      case 'date-asc':
        result.sort((a, b) => getExpenseTimestamp(a.date) - getExpenseTimestamp(b.date))
        break
      case 'amount-desc':
        result.sort((a, b) => {
          const aValue = a.displayAmount
          const bValue = b.displayAmount
          const aValid = Number.isFinite(aValue)
          const bValid = Number.isFinite(bValue)
          if (!aValid && !bValid) return 0
          if (!aValid) return 1
          if (!bValid) return -1
          return bValue - aValue
        })
        break
      case 'amount-asc':
        result.sort((a, b) => {
          const aValue = a.displayAmount
          const bValue = b.displayAmount
          const aValid = Number.isFinite(aValue)
          const bValid = Number.isFinite(bValue)
          if (!aValid && !bValid) return 0
          if (!aValid) return 1
          if (!bValid) return -1
          return aValue - bValue
        })
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date-desc':
      default:
        result.sort((a, b) => getExpenseTimestamp(b.date) - getExpenseTimestamp(a.date))
    }

    return result
  }, [expensesWithDisplay, filters])

  const summary = useMemo(() => {
    let total = 0
    let totalMissing = false
    let largest = 0
    let largestMissing = false
    expensesWithDisplay.forEach((item) => {
      if (!Number.isFinite(item.displayAmount)) {
        totalMissing = true
        largestMissing = true
        return
      }
      total += item.displayAmount
      largest = Math.max(largest, item.displayAmount)
    })

    const count = expensesWithDisplay.length
    const average = count ? (totalMissing ? null : total / count) : 0
    if (largestMissing) largest = null
    const now = new Date()
    const monthExpenses = expensesWithDisplay
      .filter((item) => {
        const date = parseExpenseDate(item.date)
        return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
      })
    let monthTotal = 0
    let monthMissing = false
    monthExpenses.forEach((item) => {
      if (!Number.isFinite(item.displayAmount)) {
        monthMissing = true
        return
      }
      monthTotal += item.displayAmount
    })

    const byCategory = expensesWithDisplay.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { total: 0, hasMissing: false }
      }
      if (!Number.isFinite(item.displayAmount)) {
        acc[item.category].hasMissing = true
      } else {
        acc[item.category].total += item.displayAmount
      }
      return acc
    }, {})

    const categoryTotals = Object.entries(byCategory)
      .map(([category, data]) => ({
        category,
        amount: data.hasMissing ? null : data.total,
      }))
      .sort((a, b) => {
        const aValue = a.amount
        const bValue = b.amount
        const aValid = Number.isFinite(aValue)
        const bValid = Number.isFinite(bValue)
        if (!aValid && !bValid) return 0
        if (!aValid) return 1
        if (!bValid) return -1
        return bValue - aValue
      })

    return {
      total: totalMissing ? null : total,
      count,
      largest,
      average,
      monthTotal: monthMissing ? null : monthTotal,
      categoryTotals,
    }
  }, [expensesWithDisplay])

  const recentWeek = useMemo(() => getRecentDays(expensesWithDisplay, 7), [expensesWithDisplay])
  const recentMonth = useMemo(() => getRecentDays(expensesWithDisplay, 30), [expensesWithDisplay])

  const insights = useMemo(() => {
    const topCategory = summary.categoryTotals.find((item) => Number.isFinite(item.amount))
    const topDay = recentMonth.reduce(
      (max, item) => (item.amount > max.amount ? item : max),
      { amount: 0 },
    )
    const averageDaily = recentMonth.reduce((sum, item) => sum + item.amount, 0) / 30

    return {
      topCategory: topCategory?.category ?? null,
      topCategoryAmount: topCategory?.amount ?? null,
      topDayLabel: topDay.amount > 0 ? topDay.label : null,
      topDayAmount: topDay.amount ?? 0,
      averageDaily: Number.isFinite(averageDaily) ? averageDaily : null,
    }
  }, [summary.categoryTotals, recentMonth])

  const handleAddExpense = useCallback((payload) => {
    setExpenses((prev) => [
      {
        id: createId(),
        name: payload.name,
        amount: payload.amount,
        currency: payload.currency || displayCurrency,
        category: payload.category,
        date: payload.date,
        note: payload.note,
      },
      ...prev,
    ])
  }, [displayCurrency])

  const handleBudgetChange = useCallback((value) => {
    if (value === null) {
      setBudget(null)
      return
    }
    setBudget({ amount: value, currency: displayCurrency })
  }, [displayCurrency])

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
      <Navbar
        currency={displayCurrency}
        currencies={availableCurrencies}
        onCurrencyChange={setDisplayCurrency}
        rateStatus={rateStatus}
      />
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
          <BudgetPlanner
            budgetAmount={budgetDisplayAmount}
            onBudgetChange={handleBudgetChange}
            spent={summary.monthTotal}
            formatCurrency={formatCurrency}
            currency={displayCurrency}
          />
          <SpendingTrends days={recentWeek} formatCurrency={formatCurrency} />
          <InsightsPanel insights={insights} formatCurrency={formatCurrency} />
        </section>

        <section className="app-grid">
          <div className="stack">
            <ExpenseForm
              categories={CATEGORIES}
              onAddExpense={handleAddExpense}
              currency={displayCurrency}
            />
            <CurrencyConverter
              total={summary.total}
              displayCurrency={displayCurrency}
              formatCurrency={formatCurrency}
              rates={rates}
              rateDate={rateDate}
              status={rateStatus}
              error={rateError}
              onRetry={() => setRateRefreshKey((prev) => prev + 1)}
            />
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
