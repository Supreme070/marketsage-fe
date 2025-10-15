const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // OpenTelemetry instrumentation is now enabled by default via instrumentation.ts
  
  // Updated to use the correct serverExternalPackages instead of experimental
  serverExternalPackages: [
    'bcrypt',
    '@xenova/transformers',
    'onnxruntime-node',
    'sharp',
    'webworker-threads',
    '@prisma/client',
    '@auth/prisma-adapter'
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
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Bundle analysis and optimization
  bundlePagesRouterDependencies: true,
  
  // Custom webpack configuration to handle ML packages and optimize bundles
  webpack: (config, { isServer, dev, nextRuntime }) => {
    // Performance optimizations for production builds
    if (!dev) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate vendor chunk for third-party libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for UI components
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 20,
          },
          // Separate chunk for LeadPulse components
          leadpulse: {
            test: /[\\/]src[\\/]components[\\/]leadpulse[\\/]/,
            name: 'leadpulse',
            chunks: 'all',
            priority: 15,
          },
          // AI and ML related components
          ai: {
            test: /[\\/]src[\\/]lib[\\/]ai[\\/]/,
            name: 'ai',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }

    // Handle Node.js built-in modules for Next.js 15 compatibility
    if (!isServer) {
      // Polyfills and fallbacks for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
        // Handle node: protocol imports
        'node:fs': false,
        'node:fs/promises': false,
        'node:path': false,
        'node:os': false,
        'node:crypto': false,
        'node:stream': false,
        'node:buffer': false,
        'node:util': false,
        'node:url': false,
        'node:querystring': false,
        'node:events': false,
        'node:async_hooks': false,
        'node:child_process': false,
      };
      
      // Ignore ML package binaries on client side
      config.externals.push({
        '@xenova/transformers': 'commonjs @xenova/transformers',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'sharp': 'commonjs sharp',
        'webworker-threads': 'commonjs webworker-threads'
      });
    }

    // Add custom loader to handle node: protocol imports
    config.module.rules.push({
      test: /node_modules.*\.(mjs|js)$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
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
    
    // Add aliases for node: imports to their regular counterparts
    config.resolve.alias = {
      ...config.resolve.alias,
      'webworker-threads': false,
    };

    // For server-side builds, allow node: protocol imports
    if (isServer) {
      // On server side, alias node: to regular module names
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:fs': 'fs',
        'node:fs/promises': 'fs/promises',
        'node:path': 'path',
        'node:os': 'os',
        'node:crypto': 'crypto',
        'node:stream': 'stream',
        'node:buffer': 'buffer',
        'node:util': 'util',
        'node:url': 'url',
        'node:querystring': 'querystring',
        'node:events': 'events',
        'node:async_hooks': 'async_hooks',
        'node:child_process': 'child_process',
      };
    }
    
    // Add webpack ignore plugin for optional dependencies
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: /^webworker-threads$/,
      })
    );
    
    return config;
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

// Export the config wrapped with Sentry
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
