import '@testing-library/jest-dom/vitest'

// Mock IntersectionObserver for framer-motion whileInView
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

global.IntersectionObserver = MockIntersectionObserver
