import { createRequire } from "module";
const require = createRequire(import.meta.url);
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @solana/web3.js uses Node built-ins that don't exist in the browser.
      // Tell webpack to use browser-compatible shims or stub them out.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,   // browser has window.crypto natively
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        zlib: false,
        http: false,
        https: false,
        url: false,
        assert: false,
      };

      // Make Buffer and process available globally (required by @solana/web3.js)
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
    }
    return config;
  },
};

export default nextConfig;
