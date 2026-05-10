import { useEffect, useMemo, useRef, useState } from 'react'
import './TextType.css'

export default function TextType({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const wrapperRef = useRef(null)

  const textArray = useMemo(() => {
    const values = Array.isArray(text) ? text : [text]
    return values.filter((value) => typeof value === 'string' && value.length > 0)
  }, [text])

  useEffect(() => {
    if (!startOnVisible || !wrapperRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    if (!isVisible || textArray.length === 0) return undefined

    const currentText = textArray[currentTextIndex]
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText

    const nextDelay = () => {
      if (!variableSpeed) return typingSpeed
      return Math.random() * (variableSpeed.max - variableSpeed.min) + variableSpeed.min
    }

    if (!isDeleting && currentCharIndex < processedText.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText(processedText.slice(0, currentCharIndex + 1))
        setCurrentCharIndex((value) => value + 1)
      }, currentCharIndex === 0 ? initialDelay || nextDelay() : nextDelay())

      return () => clearTimeout(timeoutId)
    }

    if (!isDeleting) {
      const timeoutId = setTimeout(() => {
        if (loop || currentTextIndex < textArray.length - 1) {
          setIsDeleting(true)
        }
      }, pauseDuration)

      return () => clearTimeout(timeoutId)
    }

    if (displayedText.length > 0) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((value) => value.slice(0, -1))
        setCurrentCharIndex((value) => Math.max(value - 1, 0))
      }, deletingSpeed)

      return () => clearTimeout(timeoutId)
    }

    onSentenceComplete?.(textArray[currentTextIndex], currentTextIndex)

    if (!loop && currentTextIndex === textArray.length - 1) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setIsDeleting(false)
      setCurrentCharIndex(0)
      setCurrentTextIndex((value) => (value + 1) % textArray.length)
    }, pauseDuration)

    return () => clearTimeout(timeoutId)
  }, [
    currentCharIndex,
    currentTextIndex,
    deletingSpeed,
    displayedText,
    initialDelay,
    isDeleting,
    isVisible,
    loop,
    onSentenceComplete,
    pauseDuration,
    reverseMode,
    textArray,
    typingSpeed,
    variableSpeed,
  ])

  const currentColor =
    textColors.length > 0 ? textColors[currentTextIndex % textColors.length] : 'inherit'
  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < (textArray[currentTextIndex]?.length ?? 0) || isDeleting)
  const ComponentTag = Component

  return (
    <span ref={wrapperRef} className="text-type-wrapper">
      <ComponentTag className={`text-type ${className}`.trim()} {...props}>
        <span className="text-type__content" style={{ color: currentColor }}>
          {displayedText}
        </span>
        {showCursor ? (
          <span
            className={`text-type__cursor ${cursorClassName} ${shouldHideCursor ? 'text-type__cursor--hidden' : ''}`.trim()}
          >
            {cursorCharacter}
          </span>
        ) : null}
      </ComponentTag>
    </span>
  )
}
