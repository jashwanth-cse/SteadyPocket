/**
 * Env Service — SteadyPocket
 */
export const APP_MODE = process.env.APP_MODE ?? 'dev';
export const IS_DEV = APP_MODE === 'dev';
export const IS_PROD = APP_MODE === 'prod';
export const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
