const statusMap: Record<string, { label: string; className: string }> = {
  pending_confirmation: {
    label: 'Pending',
    className: 'status-badge status-badge--pending'
  },
  confirmed: {
    label: 'Confirmed',
    className: 'status-badge status-badge--confirmed'
  },
  completed: {
    label: 'Completed',
    className: 'status-badge status-badge--completed'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'status-badge status-badge--cancelled'
  }
}

export function getBookingStatusDisplay(status: string) {
  return statusMap[status] ?? {
    label: status
      .split('_')
      .filter(Boolean)
      .map((part, index) => (index === 0 ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part))
      .join(' '),
    className: 'status-badge'
  }
}
