/**
 * NOTE: the spec's file list names this `next.config.ts`. Native TypeScript
 * config file support (`next.config.ts`) was introduced in Next.js 15;
 * this project deliberately pins Next.js 14 (see README "Tech stack" for
 * why - it avoids the React 19 / Next 15 ecosystem churn this late in a
 * large build). Next 14 hard-errors on a `.ts` config file, so this is
 * `.mjs` instead - same content and effect, just a supported extension.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  },
  eslint: {
    dirs: ["src"]
  }
};

export default nextConfig;
