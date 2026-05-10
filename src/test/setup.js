import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

function createStorageMock() {
  const store = new Map()
  return {
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key)
    },
    setItem: (key, value) => {
      store.set(String(key), String(value))
    },
    get length() {
      return store.size
    },
  }
}

beforeEach(() => {
  vi.restoreAllMocks()

  if (typeof window.localStorage?.setItem !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    })
  }

  window.localStorage.clear()

  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = ResizeObserverMock
  }

  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0)
  }

  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  }

  if (!globalThis.crypto?.randomUUID) {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        ...globalThis.crypto,
        randomUUID: () => 'test-random-uuid',
      },
    })
  }
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
