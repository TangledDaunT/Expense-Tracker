import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import useTilt from './useTilt'

function TiltProbe() {
  const ref = useTilt({ max: 10 })

  return <div ref={ref} data-testid="tilt-probe" />
}

it('activates pointer-driven 3D variables and resets them on leave', async () => {
  render(<TiltProbe />)

  const probe = screen.getByTestId('tilt-probe')
  probe.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 200,
    height: 100,
    right: 200,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  fireEvent.pointerEnter(probe, { clientX: 100, clientY: 50 })
  fireEvent.pointerMove(probe, { clientX: 160, clientY: 20 })

  await waitFor(() => {
    expect(probe.dataset.tiltActive).toBe('true')
    expect(probe.style.getPropertyValue('--tilt-y')).not.toBe('0deg')
    expect(probe.style.getPropertyValue('--tilt-shift-x')).not.toBe('0px')
    expect(probe.style.getPropertyValue('--tilt-glow-opacity')).toBe('1')
  })

  fireEvent.pointerLeave(probe)

  expect(probe.dataset.tiltActive).toBe('false')
  expect(probe.style.getPropertyValue('--tilt-x')).toBe('0deg')
  expect(probe.style.getPropertyValue('--tilt-y')).toBe('0deg')
  expect(probe.style.getPropertyValue('--tilt-shift-x')).toBe('0px')
  expect(probe.style.getPropertyValue('--tilt-glow-opacity')).toBe('0')
})
