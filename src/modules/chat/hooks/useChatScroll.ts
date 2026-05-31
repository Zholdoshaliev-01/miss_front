import { useRef, useCallback, useEffect, useState } from 'react'

interface UseChatScrollOptions {
  /** Called when the user scrolls to the top (to load older messages) */
  onLoadMore?: () => void
  /** Total messages count — used to detect new messages */
  messageCount: number
}

/**
 * Encapsulates Telegram-style scroll behavior:
 * - Auto-scroll to bottom only when user is already at bottom
 * - "Scroll to bottom" button when user scrolls up
 * - Trigger loadMore when user scrolls to top
 * - Preserve scroll position when prepending older messages
 */
export function useChatScroll({ onLoadMore, messageCount }: UseChatScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const prevScrollHeightRef = useRef<number>(0)
  const prevMessageCountRef = useRef<number>(messageCount)
  const isLoadingOlderRef = useRef(false)

  /** Check if user is near the bottom (within 150px) */
  const checkIsAtBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  /** Scroll to the very bottom */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    setIsAtBottom(true)
    setShowScrollButton(false)
  }, [])

  /** Handle scroll events */
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const atBottom = checkIsAtBottom()
    setIsAtBottom(atBottom)
    setShowScrollButton(!atBottom)

    // Load older messages when scrolled to very top
    if (el.scrollTop < 50 && onLoadMore && !isLoadingOlderRef.current) {
      isLoadingOlderRef.current = true
      prevScrollHeightRef.current = el.scrollHeight
      onLoadMore()
    }
  }, [checkIsAtBottom, onLoadMore])

  /** When messages change: auto-scroll if at bottom, or preserve position if prepending */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const prevCount = prevMessageCountRef.current
    const newCount = messageCount
    prevMessageCountRef.current = newCount

    // Messages were prepended (older messages loaded)
    if (isLoadingOlderRef.current && newCount > prevCount) {
      const newScrollHeight = el.scrollHeight
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current
      el.scrollTop = el.scrollTop + scrollDiff
      isLoadingOlderRef.current = false
      return
    }

    // New messages appended — scroll to bottom only if user was already there
    if (isAtBottom) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    }
  }, [messageCount, isAtBottom])

  /** Force scroll to bottom (e.g. when user sends a message) */
  const forceScrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      setIsAtBottom(true)
      setShowScrollButton(false)
    })
  }, [])

  /** Mark that we're about to load older messages */
  const prepareForPrepend = useCallback(() => {
    const el = containerRef.current
    if (el) {
      prevScrollHeightRef.current = el.scrollHeight
      isLoadingOlderRef.current = true
    }
  }, [])

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
    forceScrollToBottom,
    showScrollButton,
    isAtBottom,
    prepareForPrepend,
  }
}
