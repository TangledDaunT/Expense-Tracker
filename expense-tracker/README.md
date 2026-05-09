# Expense Tracker

A React + Vite expense tracker built for the Marketing Mojito assignment. The app lets users add and remove expenses, track totals, review category breakdowns, and convert the running total with live Frankfurter exchange rates.

## Tech

- React 19
- Vite 8
- Plain CSS
- Frankfurter v2 API
- Vitest + Testing Library

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

## Currency API

This app uses the current Frankfurter v2 endpoints:

- `GET https://api.frankfurter.dev/v2/rates?base=USD`
- `GET https://api.frankfurter.dev/v2/currencies`

Reference docs:

- [Frankfurter docs](https://frankfurter.dev/)

## Notes

- Expenses and budget values are stored in `localStorage`.
- The default base currency is `USD`.
- The automated tests cover add/remove/filter expense flows and currency converter loading, success, and retry states.
