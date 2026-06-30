import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  ModuleWithProviders,
  NgModule,
  Provider,
} from '@angular/core';
import { VeilService, VEIL_CONFIG } from './veil.service';
import type { WalletConfig } from '../../../src/useInvisibleWallet';

function veilProviders(config: WalletConfig): Provider[] {
  return [
    VeilService,
    { provide: VEIL_CONFIG, useValue: config },
  ];
}

export function provideVeil(config: WalletConfig): EnvironmentProviders {
  return makeEnvironmentProviders(veilProviders(config));
}

@NgModule()
export class VeilModule {
  static forRoot(config: WalletConfig): ModuleWithProviders<VeilModule> {
    return {
      ngModule: VeilModule,
      providers: veilProviders(config),
    };
  }
}
