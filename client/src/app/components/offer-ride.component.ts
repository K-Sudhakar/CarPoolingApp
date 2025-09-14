import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-offer-ride',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2>Offer a ride</h2>
      <div *ngIf="!auth.isAuthenticated()" class="warn">
        You must be logged in to post a ride.
        <button (click)="auth.loginWithGoogle()">Login with Google</button>
      </div>
      <form *ngIf="auth.isAuthenticated()" (ngSubmit)="submit()">
        <input [(ngModel)]="from" name="from" placeholder="From" required />
        <input [(ngModel)]="to" name="to" placeholder="To" required />
        <input [(ngModel)]="date" name="date" type="datetime-local" required />
        <input [(ngModel)]="seats" name="seats" type="number" min="1" placeholder="Seats" required />
        <input [(ngModel)]="price" name="price" type="number" step="0.01" placeholder="Price" required />
        <input [(ngModel)]="notes" name="notes" placeholder="Notes (optional)" />
        <button type="submit">Post ride</button>
      </form>
      <div *ngIf="message" class="msg">{{ message }}</div>
    </div>
  `,
  styles: [
    `.container{max-width:800px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:8px}`,
    `form{display:flex;gap:8px;flex-wrap:wrap}`,
    `input{padding:8px;border:1px solid #ccc;border-radius:4px}`,
    `.warn{background:#fff3cd;border:1px solid #ffeeba;padding:8px;border-radius:4px}`,
    `.msg{margin-top:8px;color:green}`,
  ],
})
export class OfferRideComponent {
  from = '';
  to = '';
  date = '';
  seats = 1;
  price = 0;
  notes = '';
  message = '';

  constructor(private api: ApiService, public auth: AuthService) {}

  submit() {
    const body = { from: this.from, to: this.to, date: this.date, seats: this.seats, price: this.price, notes: this.notes };
    this.api.createRide(body).subscribe({
      next: () => (this.message = 'Ride posted!'),
      error: (err) => (this.message = err?.error?.error || 'Failed to post ride'),
    });
  }
}

