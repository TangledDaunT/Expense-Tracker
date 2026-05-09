import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/Aurora', () => ({
  default: () => <div data-testid="aurora" />,
}))

vi.mock('./components/ColorBends', () => ({
  default: () => <div data-testid="color-bends" />,
}))

vi.mock('./components/CurrencyConverter', () => ({
  default: ({ amount, baseCurrency }) => (
    <section data-testid="currency-converter-stub">
      {baseCurrency}:{amount}
    </section>
  ),
}))

function getExpenseForm() {
  const headings = screen.getAllByRole('heading', { name: /log a new expense/i })
  return headings[headings.length - 1].closest('section')
}

async function addExpense(user, { name, amount, category, note = '' }) {
  const form = within(getExpenseForm())

  await user.clear(form.getByLabelText(/expense name/i))
  await user.type(form.getByLabelText(/expense name/i), name)
  await user.type(form.getByLabelText(/amount \(usd\)/i), amount)
  await user.selectOptions(form.getByLabelText(/^category$/i), category)

  if (note) {
    await user.type(form.getByLabelText(/note \(optional\)/i), note)
  }

  await user.click(form.getByRole('button', { name: /add expense/i }))
}

describe('App', () => {
  beforeEach(() => {
    window.fetch = vi.fn()
  })

  it('renders the empty state and required category options', () => {
    render(<App />)

    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.getByText('0 entries · $0.00 shown')).toBeInTheDocument()

    const categoryOptions = within(getExpenseForm())
      .getByLabelText(/^category$/i)
      .querySelectorAll('option')
    const labels = Array.from(categoryOptions, (option) => option.textContent)

    expect(labels).toEqual(
      expect.arrayContaining(['Food', 'Travel', 'Marketing', 'Utilities', 'Other']),
    )
  })

  it('adds expenses and shows the full category breakdown', async () => {
    const user = userEvent.setup()
    render(<App />)

    await addExpense(user, {
      name: 'Client lunch',
      amount: '12.50',
      category: 'Food',
      note: 'Pitch meeting',
    })
    await addExpense(user, {
      name: 'Meta ads',
      amount: '60',
      category: 'Marketing',
    })
    await addExpense(user, {
      name: 'Electric bill',
      amount: '25',
      category: 'Utilities',
    })

    expect(screen.getByText('Client lunch')).toBeInTheDocument()
    expect(screen.getByText('Meta ads')).toBeInTheDocument()
    expect(screen.getByText('Electric bill')).toBeInTheDocument()
    expect(screen.getByText('3 entries · $97.50 shown')).toBeInTheDocument()

    const summaryPanel = screen.getByRole('heading', { name: /snapshot/i }).closest('section')
    const summary = within(summaryPanel)
    const categoryRows = Array.from(summaryPanel.querySelectorAll('.category-row'))
    const categoryMap = Object.fromEntries(
      categoryRows.map((row) => {
        const [category, value] = row.querySelectorAll('span, strong')
        return [category?.textContent, value?.textContent]
      }),
    )

    expect(summary.getByText('Food')).toBeInTheDocument()
    expect(summary.getByText('Marketing')).toBeInTheDocument()
    expect(summary.getByText('Utilities')).toBeInTheDocument()
    expect(categoryMap).toMatchObject({
      Food: '$12.50',
      Marketing: '$60.00',
      Utilities: '$25.00',
    })
  })

  it('removes expenses and restores the empty state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await addExpense(user, {
      name: 'Taxi',
      amount: '18',
      category: 'Travel',
    })

    await user.click(screen.getByRole('button', { name: /remove/i }))

    await waitFor(() => {
      expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    })
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument()
    expect(screen.getByText('0 entries · $0.00 shown')).toBeInTheDocument()
  })

  it('filters visible expenses by search query', async () => {
    const user = userEvent.setup()
    render(<App />)

    await addExpense(user, {
      name: 'Groceries',
      amount: '30',
      category: 'Food',
    })
    await addExpense(user, {
      name: 'Train pass',
      amount: '45',
      category: 'Travel',
    })

    await user.type(screen.getByRole('searchbox', { name: /search expenses/i }), 'train')

    expect(screen.getByText('Train pass')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
    expect(screen.getByText('1 entries · $45.00 shown')).toBeInTheDocument()
  })
})
