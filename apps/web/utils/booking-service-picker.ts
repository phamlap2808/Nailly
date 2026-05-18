export interface BookingPickerService {
  id: string
  name: string
  description?: string | null
  durationMinutes: number
  priceCents: number
}

export function filterBookingServices<TService extends BookingPickerService>(
  services: TService[],
  searchQuery: string
) {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return services

  return services.filter((service) =>
    [service.name, service.description ?? ''].some((value) => value.toLowerCase().includes(query))
  )
}
