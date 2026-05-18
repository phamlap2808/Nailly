import type { AdminRole, BookingStatus } from '@nailly/shared'

export const demoSeed = {
  shop: {
    name: 'Luma Nail Studio',
    locale: 'en',
    tagline: 'Editorial nail care, soft color, and careful detail.',
    description:
      'A boutique nail studio offering structured manicures, restorative pedicures, detailed nail art, and calm appointment-only care.',
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
      key: 'demo/gallery-sheer-french.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-sheer-french.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 132000,
      altText: 'Sheer pink French manicure',
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
      key: 'demo/gallery-chrome-detail.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-chrome-detail.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 141000,
      altText: 'Soft chrome nail detail',
      usageType: 'gallery'
    },
    {
      key: 'demo/gallery-spa-pedicure.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-spa-pedicure.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 127000,
      altText: 'Warm spa pedicure setup',
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
      key: 'demo/service-builder-gel.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/service-builder-gel.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 112000,
      altText: 'Builder gel overlay service',
      usageType: 'service'
    },
    {
      key: 'demo/service-spa-pedicure.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/service-spa-pedicure.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 117000,
      altText: 'Spa pedicure service',
      usageType: 'service'
    },
    {
      key: 'demo/staff-maya.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/staff-maya.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 98000,
      altText: 'Maya, senior nail artist',
      usageType: 'staff'
    },
    {
      key: 'demo/staff-ari.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/staff-ari.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 95000,
      altText: 'Ari, nail artist',
      usageType: 'staff'
    },
    {
      key: 'demo/staff-nina.jpg',
      publicUrl: 'http://localhost:9100/nailly-media/demo/staff-nina.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 97000,
      altText: 'Nina, pedicure specialist',
      usageType: 'staff'
    }
  ],
  categories: [
    { name: 'Manicures', description: 'Natural nail shaping, cuticle care, polish, and hand care.', sortOrder: 1 },
    { name: 'Gel & Enhancements', description: 'Long-wear gel, strengthening overlays, and extensions.', sortOrder: 2 },
    { name: 'Pedicures', description: 'Relaxing foot care, exfoliation, massage, and polish.', sortOrder: 3 },
    { name: 'Nail Art', description: 'Detailed accents, chrome, French, and custom design work.', sortOrder: 4 },
    { name: 'Add-ons & Repair', description: 'Removal, repair, strengthening, and finishing upgrades.', sortOrder: 5 }
  ],
  services: [
    { categoryName: 'Manicures', name: 'Essential Manicure', description: 'Nail shaping, cuticle care, warm towel, hand massage, and polish.', durationMinutes: 40, priceCents: 3800, sortOrder: 1 },
    { categoryName: 'Manicures', name: 'Signature Manicure', description: 'Detailed cuticle work, exfoliating hand polish, massage, and lacquer finish.', durationMinutes: 55, priceCents: 5200, sortOrder: 2 },
    { categoryName: 'Manicures', name: 'Bare Nail Reset', description: 'A clean natural-nail service with buffing, hydration, and strengthening base.', durationMinutes: 35, priceCents: 3200, sortOrder: 3 },
    { categoryName: 'Manicures', name: 'French Manicure', description: 'Classic or soft French finish with careful shaping and cuticle care.', durationMinutes: 65, priceCents: 6200, sortOrder: 4 },
    { categoryName: 'Gel & Enhancements', name: 'Gel Manicure', description: 'Long-wear gel color with precise cuticle care and glossy finish.', durationMinutes: 60, priceCents: 5800, sortOrder: 5 },
    { categoryName: 'Gel & Enhancements', name: 'Builder Gel Overlay', description: 'Structured strengthening overlay for natural nails.', durationMinutes: 90, priceCents: 8200, sortOrder: 6 },
    { categoryName: 'Gel & Enhancements', name: 'Structured Gel Fill', description: 'Rebalance and refresh existing builder gel with color finish.', durationMinutes: 85, priceCents: 7600, sortOrder: 7 },
    { categoryName: 'Gel & Enhancements', name: 'Soft Gel Extensions', description: 'Full cover soft gel extensions shaped and finished with gel color.', durationMinutes: 105, priceCents: 9800, sortOrder: 8 },
    { categoryName: 'Pedicures', name: 'Classic Pedicure', description: 'Foot soak, nail care, callus smoothing, massage, and polish.', durationMinutes: 60, priceCents: 5200, sortOrder: 9 },
    { categoryName: 'Pedicures', name: 'Spa Pedicure', description: 'Extended exfoliation, hydrating mask, warm towel, massage, and polish.', durationMinutes: 75, priceCents: 7000, sortOrder: 10 },
    { categoryName: 'Pedicures', name: 'Restorative Pedicure', description: 'Extra time for dry heels, careful nail cleanup, and recovery-focused care.', durationMinutes: 90, priceCents: 8600, sortOrder: 11 },
    { categoryName: 'Pedicures', name: 'Gel Pedicure', description: 'Pedicure care finished with long-wear gel color.', durationMinutes: 75, priceCents: 7800, sortOrder: 12 },
    { categoryName: 'Nail Art', name: 'Minimal Nail Art', description: 'Simple dots, lines, or accents on up to four nails.', durationMinutes: 25, priceCents: 2400, sortOrder: 13 },
    { categoryName: 'Nail Art', name: 'Detailed Nail Art', description: 'Fine line art, layered accents, or custom details on multiple nails.', durationMinutes: 45, priceCents: 4800, sortOrder: 14 },
    { categoryName: 'Nail Art', name: 'Chrome Finish', description: 'Pearl, glaze, or chrome powder finish added over gel.', durationMinutes: 20, priceCents: 1800, sortOrder: 15 },
    { categoryName: 'Nail Art', name: 'French or Aura Add-on', description: 'French tips, aura blends, or soft gradient finish added to a base service.', durationMinutes: 30, priceCents: 3200, sortOrder: 16 },
    { categoryName: 'Add-ons & Repair', name: 'Gel Removal', description: 'Gentle gel removal with nail conditioning and cleanup.', durationMinutes: 35, priceCents: 2800, sortOrder: 17 },
    { categoryName: 'Add-ons & Repair', name: 'Nail Repair', description: 'Single nail repair, patch, or extension replacement.', durationMinutes: 20, priceCents: 1200, sortOrder: 18 }
  ],
  staff: [
    { name: 'Maya Chen', title: 'Senior Nail Artist', bio: 'Specializes in structured gel, soft neutrals, and careful natural nail prep.' },
    { name: 'Ari Morgan', title: 'Nail Artist', bio: 'Known for clean manicures, sheer color, and playful minimal nail art.' },
    { name: 'Nina Patel', title: 'Pedicure Specialist', bio: 'Focuses on restorative foot care, dry heel recovery, and calm service.' },
    { name: 'Sofia Reyes', title: 'Gel Extension Artist', bio: 'Creates balanced soft gel extensions, almond shaping, and chrome finishes.' },
    { name: 'Harper Lee', title: 'Nail Art Specialist', bio: 'Loves tiny details, French variations, aura blends, and editorial accents.' },
    { name: 'Ivy Tran', title: 'Natural Nail Specialist', bio: 'Focuses on healthy nail care, bare nail resets, and understated polish.' }
  ],
  bookings: [
    {
      relativeDayOffset: 1,
      staffName: 'Maya Chen',
      customerName: 'Olivia Carter',
      phone: '+1 408 555 0140',
      email: 'olivia.carter@example.com',
      partySize: 1,
      serviceNames: ['Gel Manicure', 'Chrome Finish'],
      startTime: '10:00',
      status: 'confirmed' as BookingStatus,
      note: 'Prefers a sheer pink chrome finish.'
    },
    {
      relativeDayOffset: 1,
      staffName: 'Nina Patel',
      customerName: 'Grace Nguyen',
      phone: '+1 408 555 0188',
      email: 'grace.nguyen@example.com',
      partySize: 1,
      serviceNames: ['Spa Pedicure'],
      startTime: '13:30',
      status: 'confirmed' as BookingStatus,
      note: 'Sensitive heels; keep massage pressure light.'
    },
    {
      relativeDayOffset: 2,
      staffName: 'Sofia Reyes',
      customerName: 'Mia Thompson',
      phone: '+1 408 555 0199',
      email: 'mia.thompson@example.com',
      partySize: 2,
      serviceNames: ['Soft Gel Extensions', 'French or Aura Add-on'],
      startTime: '11:00',
      status: 'confirmed' as BookingStatus,
      note: 'Birthday appointment for two guests.'
    },
    {
      relativeDayOffset: 2,
      staffName: 'Harper Lee',
      customerName: 'Emma Wilson',
      phone: '+1 408 555 0164',
      email: 'emma.wilson@example.com',
      partySize: 1,
      serviceNames: ['Detailed Nail Art'],
      startTime: '15:00',
      status: 'pending_confirmation' as BookingStatus,
      note: 'Wants tiny floral line art.'
    },
    {
      relativeDayOffset: 3,
      staffName: 'Ivy Tran',
      customerName: 'Chloe Martin',
      phone: '+1 408 555 0117',
      email: 'chloe.martin@example.com',
      partySize: 1,
      serviceNames: ['Bare Nail Reset', 'Gel Removal'],
      startTime: '09:30',
      status: 'confirmed' as BookingStatus,
      note: 'Taking a break from gel and wants a clean natural finish.'
    }
  ],
  adminUsers: [
    { email: 'owner@lumanails.example', password: 'owner-password', name: 'Owner Demo', role: 'owner' as AdminRole },
    { email: 'manager@lumanails.example', password: 'manager-password', name: 'Manager Demo', role: 'manager' as AdminRole },
    { email: 'staff@lumanails.example', password: 'staff-password', name: 'Staff Demo', role: 'staff' as AdminRole }
  ]
}
