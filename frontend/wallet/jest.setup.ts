import { TextEncoder, TextDecoder } from 'util'
import { webcrypto } from 'crypto'

Object.defineProperty(globalThis, 'TextEncoder', {
  value: TextEncoder,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'TextDecoder', {
  value: TextDecoder,
  writable: true,
  configurable: true,
})

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  })
}
