/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // OpenTelemetry instrumentation is now enabled by default via instrumentation.ts
  
  // Updated to use the correct serverExternalPackages instead of experimental
  serverExternalPackages: [
    '@prisma/client',
    'bcrypt',
    '@xenova/transformers',
    'onnxruntime-node',
    'sharp',
    'webworker-threads'
  ],
  
  // Removed deprecated options that were causing warnings
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com", 
      "ext.same-assets.com",
      "ugc.same-assets.com",
      "localhost"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  transpilePackages: ['next-auth'],
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Custom webpack configuration to handle ML packages
  webpack: (config, { isServer, dev }) => {
    // Exclude native binaries from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
      
      // Ignore ML package binaries on client side
      config.externals.push({
        '@xenova/transformers': 'commonjs @xenova/transformers',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'sharp': 'commonjs sharp',
        'webworker-threads': 'commonjs webworker-threads'
      });
    }
    
    // Handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader'
    });
    
    // Ignore specific binary patterns
    config.module.rules.push({
      test: /\.(node|wasm)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/[name].[hash][ext]'
      }
    });
    
    // Ignore webworker-threads in natural library
    config.resolve.alias = {
      ...config.resolve.alias,
      'webworker-threads': false
    };
    
    // Add webpack ignore plugin for optional dependencies
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: /^webworker-threads$/,
      })
    );
    
    return config;
  },
};

module.exports = nextConfig;
