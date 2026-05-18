import { describe, expect, it } from 'vitest'
import { buildSettingsPreview, buildSettingsSavePayload } from '../utils/admin-settings'

const settings = {
  name: 'Luma Nail Studio',
  tagline: 'Quiet care, polished details',
  description: 'A calm studio for modern nail care.',
  phone: '+1 555 0100',
  email: 'hello@luma.example',
  address: '12 Rose Street',
  mapUrl: 'https://maps.example.com/luma',
  seoTitle: 'Luma Nail Studio | Appointments',
  seoDescription: 'Book manicures, pedicures, and nail art.'
}

describe('admin settings helpers', () => {
  it('normalizes optional fields for the save payload', () => {
    expect(buildSettingsSavePayload({ ...settings, email: '', mapUrl: '   ' })).toMatchObject({
      name: 'Luma Nail Studio',
      email: null,
      mapUrl: null
    })

    expect(buildSettingsSavePayload(settings)).toMatchObject({
      email: 'hello@luma.example',
      mapUrl: 'https://maps.example.com/luma'
    })
  })

  it('builds readable preview copy with fallbacks', () => {
    expect(buildSettingsPreview(settings)).toEqual({
      profileTitle: 'Luma Nail Studio',
      tagline: 'Quiet care, polished details',
      description: 'A calm studio for modern nail care.',
      contactLine: '+1 555 0100 / hello@luma.example',
      address: '12 Rose Street',
      mapStatus: 'Map link ready',
      seoTitle: 'Luma Nail Studio | Appointments',
      seoDescription: 'Book manicures, pedicures, and nail art.'
    })

    expect(
      buildSettingsPreview({
        ...settings,
        name: '',
        tagline: '',
        description: '',
        phone: '',
        email: null,
        address: '',
        mapUrl: null,
        seoTitle: '',
        seoDescription: ''
      })
    ).toEqual({
      profileTitle: 'Studio name',
      tagline: 'No tagline yet',
      description: 'No public description yet.',
      contactLine: 'No contact details yet',
      address: 'No address yet',
      mapStatus: 'No map link',
      seoTitle: 'Search title',
      seoDescription: 'Search description'
    })
  })
})
