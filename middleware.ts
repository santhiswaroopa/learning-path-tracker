// Next.js middleware must be in a file named exactly `middleware.ts`
// Re-export the proxy handler and its route matcher config from proxy.ts
export { proxy as default, config } from './proxy';
