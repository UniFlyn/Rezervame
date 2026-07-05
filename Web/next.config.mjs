/** @type {import('next').NextConfig} */
// Optional sub-path deploy (e.g. rezervame-web.web.app/new). Inert unless DEPLOY_BASE_PATH is set.
const basePath = (process.env.DEPLOY_BASE_PATH || '').replace(/\/$/, '');
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;

