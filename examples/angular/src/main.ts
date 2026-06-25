import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideVeil } from 'invisible-wallet-sdk/angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideVeil({
      factoryAddress: 'YOUR_FACTORY_ADDRESS_HERE',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
    }),
  ]
});
