/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false, // Desabilitar SWC minify
  experimental: {
    forceSwcTransforms: false, // Usar Babel como fallback
  },
  webpack: (config, { isServer }) => {
    // Ignorar warnings de módulos opcionais
    config.ignoreWarnings = [
      { module: /node_modules/ },
    ];
    return config;
  },
}

module.exports = nextConfig
