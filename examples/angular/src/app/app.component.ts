import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VeilService } from 'invisible-wallet-sdk/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Veil Angular Example</h1>

      <div *ngIf="veilService.address">
        <p>Wallet Address: {{ veilService.address }}</p>
        <p>Deployed: {{ veilService.isDeployed ? 'Yes' : 'No' }}</p>
      </div>

      <div>
        <button (click)="register()">Register Passkey</button>
        <button (click)="login()" [disabled]="!veilService.address">Login</button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    button {
      margin-right: 0.5rem;
      padding: 0.5rem 1rem;
    }
  `]
})
export class AppComponent {
  veilService = inject(VeilService);

  async register() {
    try {
      const result = await this.veilService.register('angular-user');
      console.log('Registered:', result);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  }

  async login() {
    try {
      const result = await this.veilService.login();
      console.log('Login result:', result);
    } catch (err) {
      console.error('Login failed:', err);
    }
  }
}
