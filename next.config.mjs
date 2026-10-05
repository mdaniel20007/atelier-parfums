/** @type {import('next').NextConfig} */
const dev = process.env.NODE_ENV !== 'production';

// Política de contenido: el navegador solo carga scripts, estilos, fotos y conexiones de estos orígenes.
// Si alguien lograra inyectar código, no podría cargar scripts de otro sitio ni mandar datos afuera.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''} https://accounts.google.com/gsi/client`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
  `connect-src 'self' https://accounts.google.com/gsi/${dev ? ' ws: http://localhost:*' : ''}`,
  'frame-src https://accounts.google.com/gsi/',
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
      ],
    }];
  },
};
export default nextConfig;
