export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/devtools',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
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
