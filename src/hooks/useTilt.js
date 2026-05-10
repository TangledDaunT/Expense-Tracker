import { useEffect, useRef } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function resetTilt(element) {
  element.dataset.tiltActive = 'false'
  element.style.setProperty('--tilt-x', '0deg')
  element.style.setProperty('--tilt-y', '0deg')
  element.style.setProperty('--tilt-shift-x', '0px')
  element.style.setProperty('--tilt-shift-y', '0px')
  element.style.setProperty('--tilt-lift', '0px')
  element.style.setProperty('--tilt-scale', '1')
  element.style.setProperty('--tilt-glow-x', '50%')
  element.style.setProperty('--tilt-glow-y', '50%')
  element.style.setProperty('--tilt-glow-opacity', '0')
}

export default function useTilt({ max = 6, lift = 10, shift = 8, scale = 1.01 } = {}) {
  const ref = useRef(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    resetTilt(element)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const usesCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    if (prefersReducedMotion || usesCoarsePointer) return

    let rect = null

    const handlePointerMove = (event) => {
      if (!rect) rect = element.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const rotateY = clamp((x - 0.5) * 2 * max, -max, max)
      const rotateX = clamp((0.5 - y) * 2 * max, -max, max)
      const shiftX = (x - 0.5) * shift * 2
      const shiftY = (y - 0.5) * shift * 2

      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        element.dataset.tiltActive = 'true'
        element.style.setProperty('--tilt-x', `${rotateX}deg`)
        element.style.setProperty('--tilt-y', `${rotateY}deg`)
        element.style.setProperty('--tilt-shift-x', `${shiftX.toFixed(2)}px`)
        element.style.setProperty('--tilt-shift-y', `${shiftY.toFixed(2)}px`)
        element.style.setProperty('--tilt-lift', `${-lift}px`)
        element.style.setProperty('--tilt-scale', String(scale))
        element.style.setProperty('--tilt-glow-x', `${x * 100}%`)
        element.style.setProperty('--tilt-glow-y', `${y * 100}%`)
        element.style.setProperty('--tilt-glow-opacity', '1')
      })
    }

    const handlePointerLeave = () => {
      rect = null
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      resetTilt(element)
    }

    const handlePointerEnter = () => {
      rect = element.getBoundingClientRect()
      element.dataset.tiltActive = 'true'
      element.style.setProperty('--tilt-glow-opacity', '1')
    }

    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerleave', handlePointerLeave)
    element.addEventListener('pointerenter', handlePointerEnter)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerleave', handlePointerLeave)
      element.removeEventListener('pointerenter', handlePointerEnter)
      resetTilt(element)
    }
  }, [lift, max, scale, shift])

  return ref
}
