import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CurrencyConverter from './CurrencyConverter'

function jsonResponse(body, ok = true) {
  return {
    ok,
    json: async () => body,
  }
}

describe('CurrencyConverter', () => {
  it('shows a loading state while rates are being fetched', () => {
    window.fetch = vi.fn(() => new Promise(() => {}))

    render(<CurrencyConverter amount={100} baseCurrency="USD" />)

    expect(screen.getByText('Fetching latest rates...')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /convert to/i })).toBeDisabled()
  })

  it('renders converted totals from the Frankfurter v2 responses', async () => {
    window.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { date: '2026-05-09', base: 'USD', quote: 'EUR', rate: 0.85 },
          { date: '2026-05-09', base: 'USD', quote: 'GBP', rate: 0.74 },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { iso_code: 'USD', name: 'United States Dollar' },
          { iso_code: 'EUR', name: 'Euro' },
          { iso_code: 'GBP', name: 'British Pound' },
        ]),
      )

    render(<CurrencyConverter amount={100} baseCurrency="USD" />)

    expect(await screen.findByText('Rate updated 2026-05-09')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /convert to/i })).toBeEnabled()
    expect(screen.getByText('€85.00')).toBeInTheDocument()
  })

  it('shows an error state and retries successfully', async () => {
    const user = userEvent.setup()

    window.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'not found' }, false))
      .mockResolvedValueOnce(jsonResponse([], true))
      .mockResolvedValueOnce(
        jsonResponse([
          { date: '2026-05-09', base: 'USD', quote: 'EUR', rate: 0.85 },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { iso_code: 'USD', name: 'United States Dollar' },
          { iso_code: 'EUR', name: 'Euro' },
        ]),
      )

    render(<CurrencyConverter amount={100} baseCurrency="USD" />)

    expect(await screen.findByText('Unable to load live rates right now.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(screen.getByText('Rate updated 2026-05-09')).toBeInTheDocument()
    })
    expect(screen.getByText('€85.00')).toBeInTheDocument()
  })
})
