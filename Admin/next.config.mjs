/** @type {import('next').NextConfig} */
// Optional sub-path deploy (e.g. rezervame-web.web.app/new/admin). Inert unless DEPLOY_BASE_PATH is set.
const basePath = (process.env.DEPLOY_BASE_PATH || '').replace(/\/$/, '');
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;

