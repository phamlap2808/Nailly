export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],
  css: ['~/assets/css/main.css'],
  icon: {
    clientBundle: {
      icons: [
        'lucide:check',
        'lucide:credit-card',
        'lucide:grid-2x2',
        'lucide:list',
        'lucide:more-horizontal',
        'lucide:plus',
        'lucide:printer',
        'lucide:save',
        'lucide:trash-2'
      ]
    }
  },
  runtimeConfig: {
    apiBaseUrl: process.env.API_INTERNAL_BASE_URL ?? process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:8787',
    public: {
      apiBaseUrl: process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:8787'
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: [{ code: 'en', name: 'English', file: 'en.json' }],
    langDir: 'locales'
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' }
    }
  }
})
