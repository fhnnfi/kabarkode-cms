import type { NextConfig } from "next";

/**
 * Host CDN yang dipercaya untuk next/image (requirement §30).
 * Sumber dari NEXT_PUBLIC_MEDIA_URL agar tidak hardcode — saat domain
 * pindah ke cdn.kabarkode.id cukup ubah env.
 */
function cdnHostname(): string {
  const raw = process.env.NEXT_PUBLIC_MEDIA_URL || "https://cdn.fhanalabs.site";
  try {
    return new URL(raw).hostname;
  } catch {
    return "cdn.fhanalabs.site";
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: cdnHostname(),
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    // Dev tanpa menyentuh CORS backend: request browser ke /api/backend/*
    // diproksikan server-side ke API publik (same-origin, tidak kena CORS).
    // Di production (deploy Vercel) NEXT_PUBLIC_API_URL diarahkan langsung
    // ke https://kabarkodeapi.fhanalabs.site dan rewrite ini tidak dipakai.
    const target = process.env.KABARKODE_API_ORIGIN ?? "https://kabarkodeapi.fhanalabs.site";
    return [{ source: "/api/backend/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
