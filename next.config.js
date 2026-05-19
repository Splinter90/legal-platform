/** @type {import('next').NextConfig} */

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://www.mercadopago.com.ar https://www.mercadopago.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.mercadopago.com.ar https://www.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.tile.osm.org",
  "connect-src 'self' https://api.mercadopago.com https://api.cloudinary.com https://res.cloudinary.com https://nominatim.openstreetmap.org https://accounts.google.com",
  "media-src 'self' https://res.cloudinary.com",
  "frame-src 'self' https://www.mercadopago.com.ar https://www.mercadopago.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), geolocation=(self)",
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
