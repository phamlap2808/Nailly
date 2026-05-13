export interface TimeSlot {
  time: string
  available: boolean
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function buildTimeSlots(input: {
  startTime: string
  endTime: string
  durationMinutes: number
  blockedStarts: Set<string>
}): TimeSlot[] {
  const start = toMinutes(input.startTime)
  const latestStart = toMinutes(input.endTime) - input.durationMinutes
  const slots: TimeSlot[] = []

  for (let cursor = start; cursor <= latestStart; cursor += 30) {
    const time = toTime(cursor)
    slots.push({ time, available: !input.blockedStarts.has(time) })
  }

  return slots
}
