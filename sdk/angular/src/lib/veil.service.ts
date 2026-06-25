import { Injectable, Optional, Inject, InjectionToken } from '@angular/core';
import { createInvisibleWallet, InvisibleWallet } from 'invisible-wallet-sdk/vanilla';
import type { WalletConfig } from 'invisible-wallet-sdk/vanilla';

export const VEIL_CONFIG = new InjectionToken<WalletConfig>('Veil Config');

@Injectable({
  providedIn: 'root'
})
export class VeilService {
  private wallet: InvisibleWallet;

  constructor(@Optional() @Inject(VEIL_CONFIG) config?: WalletConfig) {
    if (!config) {
      throw new Error('VeilService requires a WalletConfig. Provide it via VEIL_CONFIG injection token.');
    }
    this.wallet = createInvisibleWallet(config);
  }

  get address(): string | null {
    return this.wallet.address;
  }

  get isDeployed(): boolean {
    return this.wallet.isDeployed;
  }

  async register(username?: string) {
    return this.wallet.register(username);
  }

  async deploy(signerKeypair: any, publicKeyBytes?: Uint8Array) {
    return this.wallet.deploy(signerKeypair, publicKeyBytes);
  }

  async signAuthEntry(signaturePayload: Uint8Array) {
    return this.wallet.signAuthEntry(signaturePayload);
  }

  async login() {
    return this.wallet.login();
  }

  async getNonce() {
    return this.wallet.getNonce();
  }
}
