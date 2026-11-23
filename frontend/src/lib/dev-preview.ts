export function isLocalDevPreview(): boolean {
  return process.env.NODE_ENV === 'development'
    && process.env.NEXT_PUBLIC_DEV_SKIP_LOGIN === 'true'
    && typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}
