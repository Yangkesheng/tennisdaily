interface CalendarJump {
  year: number
  month: number
}

let pendingJump: CalendarJump | null = null

export const setCalendarJump = (year: number, month: number) => {
  pendingJump = { year, month }
}

export const takeCalendarJump = (): CalendarJump | null => {
  const jump = pendingJump
  pendingJump = null
  return jump
}
