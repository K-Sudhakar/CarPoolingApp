import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
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

