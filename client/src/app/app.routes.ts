import { Routes } from '@angular/router';
import { HomeComponent } from './components/home.component';
import { OfferRideComponent } from './components/offer-ride.component';
import { AuthCallbackComponent } from './components/auth-callback.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'offer', component: OfferRideComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' },
];
