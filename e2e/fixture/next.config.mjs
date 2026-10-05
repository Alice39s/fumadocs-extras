import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  turbopack: { root },
  outputFileTracingRoot: root,
}
