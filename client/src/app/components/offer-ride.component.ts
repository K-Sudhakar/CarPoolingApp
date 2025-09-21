import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-offer-ride',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="offer-shell">
      <header class="offer-header">
        <h1>Share your ride</h1>
        <p>Post a trip and help fellow commuters reach their destination comfortably.</p>
      </header>

      <div *ngIf="!auth.isAuthenticated()" class="warn">
        <div class="warn-title">You're almost there!</div>
        <p>Sign in with Google to manage your rides and keep passengers informed.</p>
        <button type="button" (click)="auth.loginWithGoogle()">Login with Google</button>
      </div>

      <form *ngIf="auth.isAuthenticated()" (ngSubmit)="submit()" class="offer-form">
        <div class="form-grid">
          <label class="field">
            <span class="field-label">From</span>
            <input [(ngModel)]="from" name="from" placeholder="Pickup point" required />
          </label>
          <label class="field">
            <span class="field-label">To</span>
            <input [(ngModel)]="to" name="to" placeholder="Drop-off location" required />
          </label>
          <label class="field">
            <span class="field-label">Departure</span>
            <input
              [(ngModel)]="date"
              name="date"
              type="datetime-local"
              [min]="minDepartureDateTime"
              required
            />
          </label>
          <label class="field">
            <span class="field-label">Seats available</span>
            <input [(ngModel)]="seats" name="seats" type="number" min="1" required />
          </label>
          <label class="field">
            <span class="field-label">Price (USD)</span>
            <input [(ngModel)]="price" name="price" type="number" step="0.01" min="0" required />
          </label>
          <label class="field notes-field">
            <span class="field-label">Notes</span>
            <input
              [(ngModel)]="notes"
              name="notes"
              placeholder="Optional details for passengers"
            />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Posting...' : 'Post ride' }}
          </button>
          <a routerLink="/" class="secondary-link">Back to home</a>
        </div>
      </form>

      <div *ngIf="message" class="msg success">
        <span>{{ message }}</span>
        <div class="msg-links">
          <a routerLink="/" class="msg-link">View rides</a>
          <button type="button" class="msg-link" (click)="startAnother()">Post another</button>
        </div>
      </div>

      <div *ngIf="errorMessage" class="msg error">{{ errorMessage }}</div>
    </section>
  `,
  styles: [
    `.offer-shell{max-width:960px;margin:0 auto;padding:48px 24px;display:flex;flex-direction:column;gap:24px}`,
    `.offer-header h1{margin:0;font-size:2.25rem;font-weight:600;color:#0f172a}`,
    `.offer-header p{margin:8px 0 0;color:#475569;font-size:1.05rem;max-width:520px}`,
    `.offer-form{display:flex;flex-direction:column;gap:24px;background:#fff;border-radius:18px;padding:24px;box-shadow:0 12px 32px -12px rgba(15,23,42,0.2)}`,
    `.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}`,
    `.field{display:flex;flex-direction:column;gap:6px}`,
    `.field-label{font-weight:500;color:#1f2937}`,
    `.field input{padding:12px 14px;border:1px solid #d0d7e2;border-radius:10px;font-size:0.95rem;transition:border-color 0.2s,box-shadow 0.2s}`,
    `.field input:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 4px rgba(59,130,246,0.15)}`,
    `.notes-field{grid-column:1 / -1}`,
    `.form-actions{display:flex;flex-wrap:wrap;align-items:center;gap:16px}`,
    `.form-actions button{padding:12px 20px;background:#2563eb;color:#fff;border:none;border-radius:999px;font-weight:600;cursor:pointer;transition:background 0.2s}`,
    `.form-actions button:disabled{cursor:not-allowed;opacity:0.6}`,
    `.form-actions button:not(:disabled):hover{background:#1d4ed8}`,
    `.secondary-link{color:#2563eb;text-decoration:none;font-weight:500}`,
    `.secondary-link:hover{text-decoration:underline}`,
    `.warn{background:#fff7ed;border:1px solid #fbbf24;color:#92400e;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:12px}`,
    `.warn button{align-self:flex-start;padding:10px 18px;border-radius:999px;border:none;background:#ea580c;color:#fff;font-weight:600;cursor:pointer}`,
    `.warn button:hover{background:#c2410c}`,
    `.warn-title{font-weight:600;font-size:1.05rem}`,
    `.msg{padding:20px 24px;border-radius:16px;font-weight:500;display:flex;flex-direction:column;gap:12px}`,
    `.msg.success{background:#ecfdf5;border:1px solid #6ee7b7;color:#047857}`,
    `.msg.error{background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c}`,
    `.msg-links{display:flex;flex-wrap:wrap;gap:16px}`,
    `.msg-link{background:none;border:none;padding:0;color:#0f172a;text-decoration:underline;font-weight:600;cursor:pointer}`,
    `.msg-link:hover{color:#1d4ed8}`,
    `@media (max-width:600px){.offer-shell{padding:32px 16px}.offer-form{padding:20px}.offer-header h1{font-size:1.9rem}}`,
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
  errorMessage = '';
  isSubmitting = false;
  minDepartureDateTime = this.buildMinDateTime();

  constructor(private api: ApiService, public auth: AuthService) {}

  submit() {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.errorMessage = '';

    const selectedDeparture = this.date ? new Date(this.date) : null;
    const earliestAllowed = new Date(this.minDepartureDateTime);
    if (selectedDeparture && selectedDeparture < earliestAllowed) {
      this.isSubmitting = false;
      this.errorMessage = 'Please choose a future departure time.';
      return;
    }

    const body = {
      from: this.from,
      to: this.to,
      date: this.date,
      seats: this.seats,
      price: this.price,
      notes: this.notes,
    };

    this.api.createRide(body).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.message = 'Ride posted successfully!';
        this.minDepartureDateTime = this.buildMinDateTime();
        this.resetFormFields();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.error || 'Failed to post ride';
      },
    });
  }

  startAnother() {
    this.message = '';
    this.errorMessage = '';
    this.resetFormFields();
    this.minDepartureDateTime = this.buildMinDateTime();
  }

  private resetFormFields() {
    this.from = '';
    this.to = '';
    this.date = '';
    this.seats = 1;
    this.price = 0;
    this.notes = '';
  }

  private buildMinDateTime(): string {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
