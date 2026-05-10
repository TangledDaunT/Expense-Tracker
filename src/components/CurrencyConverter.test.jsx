import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CurrencyConverter from './CurrencyConverter'

const formatCurrency = (value, currency) => {
  if (!Number.isFinite(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

describe('CurrencyConverter', () => {
  it('shows a loading state while rates are being fetched', () => {
    render(
      <CurrencyConverter
        total={100}
        displayCurrency="USD"
        formatCurrency={formatCurrency}
        rates={{ USD: 1 }}
        rateDate=""
        status="loading"
        error=""
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Fetching latest rates...')).toBeInTheDocument()
  })

  it('renders a rate snapshot when ready', () => {
    render(
      <CurrencyConverter
        total={100}
        displayCurrency="USD"
        formatCurrency={formatCurrency}
        rates={{ USD: 1, EUR: 0.85, GBP: 0.74, INR: 83.2 }}
        rateDate="2026-05-09"
        status="ready"
        error=""
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Rate updated 2026-05-09')).toBeInTheDocument()
    expect(screen.getByText('INR')).toBeInTheDocument()
    expect(screen.getByText('83.200')).toBeInTheDocument()
  })

  it('shows an error state and retries', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <CurrencyConverter
        total={100}
        displayCurrency="USD"
        formatCurrency={formatCurrency}
        rates={{ USD: 1 }}
        rateDate=""
        status="error"
        error="Unable to load live rates right now."
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('Unable to load live rates right now.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
