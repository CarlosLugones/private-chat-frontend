/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's no longer recognized
  
  // Remove transpilePackages as it conflicts with serverExternalPackages
  
  webpack: (config) => {
    // Add CSS handling for prismjs
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    
    return config;
  },
  
  // Replace serverComponentsExternalPackages with serverExternalPackages
  experimental: {
    // This makes the package available on the server without being bundled
    // which is needed for proper CSS loading
    appDir: true
  }
};

module.exports = nextConfig;
