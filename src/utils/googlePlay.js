const configuredPlayPackage = import.meta.env.VITE_PLAY_APP_PACKAGE || ''
const configuredPlayStoreUrl = import.meta.env.VITE_PLAY_STORE_URL || ''

export const PLAY_APP_PACKAGE = configuredPlayPackage || 'app.fortressforesight'
export const PLAY_STORE_URL = configuredPlayStoreUrl
  || (configuredPlayPackage ? `https://play.google.com/store/apps/details?id=${configuredPlayPackage}` : '')

export const hasPlayStoreUrl = Boolean(PLAY_STORE_URL)

export function supportsDigitalGoodsApi() {
  return typeof window !== 'undefined' && typeof window.getDigitalGoodsService === 'function'
}
