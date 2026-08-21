import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: {
    preset: 'smallest', // Most aggressive tree-shaking
    moduleSideEffects: false, // Assume no side effects for better elimination
  },
  minify: 'terser', // Better minification than esbuild's default
  minifyIdentifiers: true,
  terserOptions: {
    compress: {
      passes: 3, // Multiple compression passes
      pure_getters: true,
      unsafe_arrows: true,
      drop_console: false, // Keep console for now, users can strip
    },
    mangle: {
      properties: false, // Don't mangle properties for API safety
    },
  },
  external: ['react', '@tanstack/react-query'],
});
