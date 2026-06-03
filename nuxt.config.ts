export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
