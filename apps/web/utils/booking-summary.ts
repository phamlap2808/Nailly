interface SummaryService {
  id: string
  name: string
  durationMins: number
  priceCents: number
}

interface BookingSummaryInput {
  services: SummaryService[]
  selectedServiceIds: string[]
  appointmentDate: string
  startTime: string | null
  partySize: number
}

export function buildBookingSummary(input: BookingSummaryInput) {
  const selectedServices = input.selectedServiceIds
    .map((id) => input.services.find((service) => service.id === id))
    .filter((service): service is SummaryService => Boolean(service))

  const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationMins, 0)
  const totalPriceCents = selectedServices.reduce((sum, service) => sum + service.priceCents, 0)
  const remainingCount = selectedServices.length - 1

  return {
    selectedServices,
    serviceLabel: selectedServices.length
      ? `${selectedServices[0].name}${remainingCount > 0 ? ` + ${remainingCount} more` : ''}`
      : 'Choose services',
    durationLabel: totalDuration > 0 ? `${totalDuration} min` : 'Select services',
    totalPriceCents,
    dateLabel: input.appointmentDate || 'Choose a date',
    timeLabel: input.startTime || 'Choose a time',
    partyLabel: `${input.partySize} ${input.partySize === 1 ? 'guest' : 'guests'}`
  }
}
