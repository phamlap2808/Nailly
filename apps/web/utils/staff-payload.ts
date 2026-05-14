export interface StaffSaveForm {
  name: string
  title: string
  bio: string
  active: boolean
  serviceIds: string[]
}

export function buildStaffSavePayload(
  form: StaffSaveForm,
  options: { includeServiceIds: boolean }
) {
  const payload: {
    name: string
    title: string
    bio: string
    active: boolean
    serviceIds?: string[]
  } = {
    name: form.name,
    title: form.title,
    bio: form.bio,
    active: form.active
  }

  if (options.includeServiceIds) {
    payload.serviceIds = [...form.serviceIds]
  }

  return payload
}
