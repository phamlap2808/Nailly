import type { AdminRole } from '@nailly/shared'

export const demoSeed = {
  shop: {
    name: 'Luma Nail Studio',
    locale: 'en',
    tagline: 'Modern nail care with calm, careful detail.',
    description:
      'A one-shop nail studio offering manicures, pedicures, gel care, nail art, and restorative treatments.',
    phone: '+1 555 0134',
    email: 'hello@lumanails.example',
    address: '128 Main Street, Suite 4, San Jose, CA',
    mapUrl: 'https://maps.example.com/luma-nail-studio',
    openingHours: {
      monday: '09:00 - 19:30',
      tuesday: '09:00 - 19:30',
      wednesday: '09:00 - 19:30',
      thursday: '09:00 - 19:30',
      friday: '09:00 - 19:30',
      saturday: '09:00 - 18:00',
      sunday: 'Closed'
    },
    seoTitle: 'Luma Nail Studio | Nail Appointments',
    seoDescription: 'Book manicures, pedicures, gel nails, and nail art at Luma Nail Studio.'
  },
  media: [
    {
      key: 'demo/gallery-soft-pink-manicure.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-soft-pink-manicure.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 118000,
      altText: 'Soft pink gel manicure',
      usageType: 'gallery'
    },
    {
      key: 'demo/gallery-minimal-nail-art.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-minimal-nail-art.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 124000,
      altText: 'Minimal line nail art',
      usageType: 'gallery'
    },
    {
      key: 'demo/service-gel-manicure.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/service-gel-manicure.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 103000,
      altText: 'Gel manicure service',
      usageType: 'service'
    },
    {
      key: 'demo/staff-maya.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/staff-maya.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 98000,
      altText: 'Maya, senior nail artist',
      usageType: 'staff'
    }
  ],
  categories: [
    { name: 'Manicures', description: 'Classic and gel manicure care.', sortOrder: 1 },
    { name: 'Pedicures', description: 'Relaxing foot care and polish.', sortOrder: 2 },
    { name: 'Nail Art', description: 'Detailed accents and custom designs.', sortOrder: 3 }
  ],
  services: [
    { categoryName: 'Manicures', name: 'Classic Manicure', description: 'Shape, cuticle care, massage, and polish.', durationMinutes: 45, priceCents: 3500, sortOrder: 1 },
    { categoryName: 'Manicures', name: 'Gel Manicure', description: 'Long-wear gel color with precise cuticle care.', durationMinutes: 60, priceCents: 5200, sortOrder: 2 },
    { categoryName: 'Manicures', name: 'Builder Gel Overlay', description: 'Strengthening overlay for natural nails.', durationMinutes: 90, priceCents: 7800, sortOrder: 3 },
    { categoryName: 'Pedicures', name: 'Classic Pedicure', description: 'Foot soak, nail care, massage, and polish.', durationMinutes: 60, priceCents: 4800, sortOrder: 4 },
    { categoryName: 'Pedicures', name: 'Spa Pedicure', description: 'Extended exfoliation, mask, massage, and polish.', durationMinutes: 75, priceCents: 6500, sortOrder: 5 },
    { categoryName: 'Nail Art', name: 'Minimal Nail Art', description: 'Simple accents on up to four nails.', durationMinutes: 30, priceCents: 2200, sortOrder: 6 }
  ],
  staff: [
    { name: 'Maya Chen', title: 'Senior Nail Artist', bio: 'Specializes in gel structure and soft neutral finishes.' },
    { name: 'Ari Morgan', title: 'Nail Artist', bio: 'Known for clean manicures and playful minimal art.' },
    { name: 'Nina Patel', title: 'Pedicure Specialist', bio: 'Focuses on restorative foot care and calm service.' }
  ],
  adminUsers: [
    { email: 'owner@lumanails.example', password: 'owner-password', name: 'Owner Demo', role: 'owner' as AdminRole },
    { email: 'manager@lumanails.example', password: 'manager-password', name: 'Manager Demo', role: 'manager' as AdminRole },
    { email: 'staff@lumanails.example', password: 'staff-password', name: 'Staff Demo', role: 'staff' as AdminRole }
  ]
}
