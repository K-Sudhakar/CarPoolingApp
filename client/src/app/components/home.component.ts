import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <h1>Carpool</h1>
        <button *ngIf="!auth.isAuthenticated()" (click)="auth.loginWithGoogle()">Login with Google</button>
        <span *ngIf="auth.isAuthenticated()">Logged in</span>
      </header>

      <section class="search">
        <h3>Find a ride</h3>
        <form (ngSubmit)="search()">
          <input [(ngModel)]="from" name="from" placeholder="From" />
          <input [(ngModel)]="to" name="to" placeholder="To" />
          <input [(ngModel)]="date" name="date" type="date" />
          <button type="submit">Search</button>
        </form>
      </section>

      <section class="results">
        <h3>Results</h3>
        <div *ngIf="rides.length === 0">No rides yet</div>
        <ul>
          <li *ngFor="let r of rides">
            <strong>{{ r.from }} → {{ r.to }}</strong>
            on {{ r.date | date:'mediumDate' }} | seats: {{ r.seats }} | ${{ r.price }}
            <div>Driver: {{ r.driver?.name }}</div>
          </li>
        </ul>
      </section>
    </div>
  `,
  styles: [
    `.container{max-width:800px;margin:0 auto;padding:16px}`,
    `.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}`,
    `.search form{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}`,
    `input{padding:8px;border:1px solid #ccc;border-radius:4px}`,
    `button{padding:8px 12px}`,
  ],
})
export class HomeComponent {
  from = '';
  to = '';
  date = '';
  rides: any[] = [];

  constructor(private api: ApiService, public auth: AuthService) {}

  search() {
    const params: any = {};
    if (this.from) params.from = this.from;
    if (this.to) params.to = this.to;
    if (this.date) params.date = this.date;
    this.api.getRides(params).subscribe((res) => (this.rides = res));
  }
}

