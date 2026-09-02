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
};

export default nextConfig;
