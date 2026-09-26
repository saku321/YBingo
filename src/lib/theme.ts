import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'yb-theme'

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e1016' : '#f5f7fb')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* private mode: theme just won't be remembered */
  }
}

/** <html data-theme> is the single source of truth, so every component using the hook stays in step. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  // Keep several tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
      document.documentElement.dataset.theme = e.newValue
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onStorage)
  }
}

/** Light is the default; the choice is remembered per browser. */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current)
  const toggle = useCallback(() => apply(current() === 'dark' ? 'light' : 'dark'), [])
  return [theme, toggle]
}
