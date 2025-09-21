import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import {
  ApiService,
  Ride,
  RideMyRequest,
  RideRequestDetail,
  SeatRequestResponse,
  SeatRequestStatus,
} from '../services/api.service';
import { AuthService, AuthUser } from '../services/auth.service';
type RequestUiState = 'idle' | 'loading' | 'success' | 'error';
type DriverRideRequest = RideRequestDetail & { key: string };
type DriverRide = Omit<Ride, 'requests' | 'myRequest'> & { requests: DriverRideRequest[] };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatToolbarModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatChipsModule, MatDividerModule, RouterLink],
  templateUrl: './home.component.html',
  styles: [
    `.app-shell{display:flex;flex-direction:column;min-height:100vh;background:linear-gradient(180deg,#f8fbff 0%,#eef2ff 40%,#ffffff 100%);}`,
    `.app-toolbar{padding:0 32px;min-height:72px;}`,
    `.brand{display:flex;flex-direction:column;gap:4px;}`,
    `.app-title{font-weight:700;font-size:1.6rem;letter-spacing:-0.01em;}`,
    `.app-tagline{font-size:0.8rem;color:rgba(255,255,255,0.8);}`,
    `.toolbar-spacer{flex:1 1 auto;}`,
    `.user-actions{display:flex;align-items:center;gap:16px;}`,
    `.user-avatar{width:40px;height:40px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px rgba(255,255,255,0.4);}`,
    `.user-avatar img{width:100%;height:100%;object-fit:cover;}`,
    `.user-meta{display:flex;flex-direction:column;line-height:1.2;}`,
    `.user-name{font-weight:600;color:#fff;}`,
    `.user-email{font-size:0.8rem;color:rgba(255,255,255,0.85);}`,
    `.content{flex:1;padding:48px 16px 72px;max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:32px;}`,
    `.hero{display:flex;gap:32px;align-items:center;justify-content:space-between;padding:40px 32px;background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.02));border-radius:28px;}`,
    `.hero-copy{max-width:520px;display:flex;flex-direction:column;gap:18px;}`,
    `.hero-kicker{margin:0;font-weight:600;color:#2563eb;letter-spacing:0.08em;text-transform:uppercase;font-size:0.85rem;}`,
    `.hero-title{margin:0;font-size:2.8rem;font-weight:700;color:#0f172a;line-height:1.1;}`,
    `.hero-body{margin:0;color:#475569;font-size:1.05rem;}`,
    `.hero-actions{display:flex;flex-wrap:wrap;gap:16px;}`,
    `.hero-actions button{min-width:148px;font-weight:600;}`,
    `.hero-visual{flex:1;display:flex;justify-content:flex-end;}`,
    `.hero-card{background:#fff;border-radius:24px;padding:24px;max-width:320px;display:flex;flex-direction:column;gap:12px;}`,
    `.hero-card-header{display:flex;align-items:center;justify-content:space-between;}`,
    `.hero-card-title{font-weight:600;color:#1f2937;}`,
    `.hero-card-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;color:#4b5563;font-size:0.95rem;}`,
    `.search-card,.results-card,.driver-card{border-radius:20px;overflow:hidden;}`,
    `.search-form{display:flex;flex-direction:column;gap:16px;}`,
    `.search-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}`,
    `.search-actions{display:flex;justify-content:flex-end;}`,
    `.rides-grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}`,
    `.ride-card{border-radius:18px;display:flex;flex-direction:column;gap:8px;}`,
    `.ride-meta{margin-bottom:8px;}`,
    `.meta-chip-set{display:flex;flex-wrap:wrap;gap:10px;}`,
    `.meta-chip-set mat-chip{font-weight:500;}`,
    `.badge-chip{background-color:#e0e7ff;color:#1f2937;}`,
    `.badge-chip.low{background-color:#fde68a;color:#78350f;}`,
    `.badge-chip.pending{background-color:#fde68a;color:#92400e;}`,
    `.badge-chip.approved{background-color:#dcfce7;color:#166534;}`,
    `.badge-chip.rejected{background-color:#fee2e2;color:#b91c1c;}`,
    `.ride-driver{margin-top:4px;}`,
    `.ride-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px;}`,
    `.inline-feedback{font-size:0.85rem;}`,
    `.inline-feedback.error{color:#c62828;}`,
    `.inline-feedback.success{color:#2e7d32;}`,
    `.status-wrapper{display:flex;align-items:center;gap:10px;}`,
    `.status-text{font-size:0.85rem;color:#4b5563;}`,
    `.login-prompt{padding:16px;}`,
    `.empty-state{padding:24px;text-align:center;color:#6b7280;}`,
    `.driver-actions{display:flex;justify-content:flex-end;margin-bottom:16px;}`,
    `.driver-rides{display:flex;flex-direction:column;gap:16px;}`,
    `.driver-ride-card{border-radius:18px;}`,
    `.request-list{display:flex;flex-direction:column;gap:12px;margin-top:16px;}`,
    `.request-item{border:1px solid #e0e7ff;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;}`,
    `.request-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}`,
    `.request-name{font-weight:600;}`,
    `.driver-controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px;}`,
    `.resolved-label{font-size:0.9rem;color:#4b5563;}`,
    `.driver-error{color:#c62828;margin-bottom:12px;}`,
    `.subtle{color:#6b7280;font-size:0.9rem;}`,
    `.driver-ride-actions{display:flex;align-items:center;gap:12px;padding:0 16px 16px;}`,
    `@media (max-width:960px){.hero{flex-direction:column;align-items:flex-start;padding:32px}.hero-visual{width:100%;justify-content:center}.hero-card{max-width:100%;}}`,
    `@media (max-width:600px){.content{padding:32px 12px 48px}.app-toolbar{padding:0 16px;min-height:64px}.user-actions{gap:8px}.hero-title{font-size:2.2rem}.hero-actions{width:100%}.hero-actions button{flex:1}.driver-actions{justify-content:stretch}.driver-actions button{width:100%;}.ride-actions{padding:16px 0;}}`,
  ],
})
export class HomeComponent implements OnInit {
  from = '';
  to = '';
  date = '';
  rides: Ride[] = [];
  myRides: DriverRide[] = [];
  user$!: Observable<AuthUser | null>;
  removalStatus: Record<string, RequestUiState> = {};
  removalMessage: Record<string, string> = {};
  minSearchDate = this.buildDateInputValue(new Date());
  requestStatus: Record<string, RequestUiState> = {};
  requestMessage: Record<string, string> = {};
  requestActionStatus: Record<string, RequestUiState> = {};
  requestActionMessage: Record<string, string> = {};
  myRidesLoading = false;
  myRidesError = '';

  passengerStatusLabels: Record<SeatRequestStatus, string> = {
    pending: 'Request pending',
    approved: 'Approved',
    rejected: 'Request rejected',
  };

  passengerStatusMessages: Record<SeatRequestStatus, string> = {
    pending: 'Waiting for driver approval',
    approved: 'Driver approved your request',
    rejected: 'Request rejected',
  };

  constructor(private api: ApiService, public auth: AuthService) {
    this.user$ = this.auth.user$;
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.ensureUserLoaded().subscribe({ error: () => {} });
      this.loadMyRides();
    }
  }

  search() {
    const params: Record<string, string> = {};
    if (this.from) params['from'] = this.from;
    if (this.to) params['to'] = this.to;
    if (this.date) params['date'] = this.date;

    this.api.getRides(params).subscribe((res) => {
      this.rides = res.map((ride) => ({
        ...ride,
        remainingSeats: ride.remainingSeats ?? ride.seats,
      }));
      this.requestStatus = {};
      this.requestMessage = {};
      this.applyDriverRemainingSeats();
    });
  }

  scrollToResults() {
    const target = typeof document !== 'undefined' ? document.getElementById('available-rides') : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  requestSeat(ride: Ride) {
    if (!ride || !ride._id) {
      return;
    }

    if (ride.myRequest) {
      return;
    }

    const rideId = ride._id;
    if (this.requestStatus[rideId] === 'loading') {
      return;
    }

    this.requestStatus[rideId] = 'loading';
    this.requestMessage[rideId] = '';

    this.api.requestSeat(rideId).subscribe({
      next: (response) => {
        this.requestStatus[rideId] = 'success';
        this.requestMessage[rideId] = '';
        this.applySeatRequestResponse(response);
      },
      error: (err) => {
        this.requestStatus[rideId] = 'error';
        const message =
          (err?.error && typeof err.error.error === 'string' && err.error.error) ||
          'Failed to send request';
        this.requestMessage[rideId] = message;
      },
    });
  }

  loadMyRides() {
    if (!this.auth.isAuthenticated()) {
      this.resetDriverState();
      return;
    }

    this.myRidesLoading = true;
    this.myRidesError = '';

    this.api.getMyRides().subscribe({
      next: (rides) => {
        this.myRidesLoading = false;
        this.myRides = this.prepareDriverRides(rides);
        this.requestActionStatus = {};
        this.requestActionMessage = {};
        this.applyDriverRemainingSeats();
      },
      error: (err) => {
        this.myRidesLoading = false;
        this.myRidesError =
          (err?.error && typeof err.error.error === 'string' && err.error.error) ||
          'Failed to load your rides';
      },
    });
  }

  updateRequestStatus(ride: DriverRide, request: DriverRideRequest, status: 'approved' | 'rejected') {
    const rideId = ride?._id;
    const requestId = request?.id;
    if (!rideId || !requestId) {
      return;
    }

    const key = request.key || this.buildRequestKey(rideId, requestId);
    if (this.requestActionStatus[key] === 'loading') {
      return;
    }

    this.requestActionStatus[key] = 'loading';
    this.requestActionMessage[key] = '';

    this.api.updateSeatRequest(rideId, requestId, { status }).subscribe({
      next: (response) => {
        this.requestActionStatus[key] = 'success';
        this.requestActionMessage[key] = status === 'approved' ? 'Approved' : 'Rejected';
        this.applySeatRequestUpdate(response);
      },
      error: (err) => {
        this.requestActionStatus[key] = 'error';
        const message =
          (err?.error && typeof err.error.error === 'string' && err.error.error) ||
          'Failed to update request';
        this.requestActionMessage[key] = message;
      },
    });
  }

  removeRide(ride: DriverRide) {
    const rideId = ride?._id;
    if (!rideId) {
      return;
    }
    if (this.removalStatus[rideId] === 'loading') {
      return;
    }

    this.removalStatus[rideId] = 'loading';
    this.removalMessage[rideId] = '';

    this.api.deleteRide(rideId).subscribe({
      next: () => {
        this.removalStatus[rideId] = 'success';
        this.removalMessage[rideId] = 'Ride removed';
        this.removeRideFromLists(rideId);
      },
      error: (err) => {
        this.removalStatus[rideId] = 'error';
        this.removalMessage[rideId] =
          (err?.error && typeof err.error.error === 'string' && err.error.error) ||
          'Failed to remove ride';
      },
    });
  }
  handleLogout() {
    this.resetPassengerState();
    this.resetDriverState();
    this.auth.logout();
  }

  shouldDisablePassengerRequest(ride: Ride): boolean {
    if (!ride || !ride._id) {
      return true;
    }
    if (this.requestStatus[ride._id] === 'loading') {
      return true;
    }
    return !!ride.myRequest;
  }

  getPassengerRequestButtonLabel(ride: Ride): string {
    if (!ride || !ride._id) {
      return 'Request seat';
    }
    if (this.requestStatus[ride._id] === 'loading') {
      return 'Sending...';
    }
    if (ride.myRequest) {
      return this.passengerStatusLabels[ride.myRequest.status];
    }
    if (this.requestStatus[ride._id] === 'error') {
      return 'Retry request';
    }
    if (this.requestStatus[ride._id] === 'success') {
      return 'Request sent';
    }
    return 'Request seat';
  }

  private buildDateInputValue(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private removeRideFromLists(rideId: string) {
    this.myRides = this.myRides.filter((ride) => ride._id !== rideId);
    this.rides = this.rides.filter((ride) => ride._id !== rideId);
    delete this.requestStatus[rideId];
    delete this.requestMessage[rideId];
    delete this.removalStatus[rideId];
    delete this.removalMessage[rideId];

    const prefix = `${rideId}::`;
    Object.keys(this.requestActionStatus).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete this.requestActionStatus[key];
        delete this.requestActionMessage[key];
      }
    });
  }

  private prepareDriverRides(rides: Ride[]): DriverRide[] {
    return rides.map((ride) => ({
      ...ride,
      remainingSeats: ride.remainingSeats ?? ride.seats,
      requests: (ride.requests ?? []).map((req) => ({
        ...req,
        key: this.buildRequestKey(ride._id, req.id),
      })),
    }));
  }

  private buildRequestKey(rideId: string, requestId?: string | null) {
    return `${rideId}:${requestId ?? ''}`;
  }

  private applyDriverRemainingSeats() {
    if (!this.myRides.length || !this.rides.length) {
      return;
    }
    const remainingMap = new Map(this.myRides.map((ride) => [ride._id, ride.remainingSeats]));
    this.rides = this.rides.map((ride) =>
      remainingMap.has(ride._id)
        ? { ...ride, remainingSeats: remainingMap.get(ride._id) ?? ride.remainingSeats }
        : ride
    );
  }

  private updateRideRemainingSeats(rideId: string, remainingSeats: number) {
    this.rides = this.rides.map((ride) =>
      ride._id === rideId ? { ...ride, remainingSeats } : ride
    );
    this.myRides = this.myRides.map((ride) =>
      ride._id === rideId ? { ...ride, remainingSeats } : ride
    );
  }

  private applySeatRequestUpdate(response: SeatRequestResponse) {
    const { rideId, remainingSeats, request } = response;
    this.myRides = this.myRides.map((ride) => {
      if (ride._id !== rideId) {
        return ride;
      }
      const updatedRequests = ride.requests.map((existing) =>
        existing.id === request.id
          ? {
              ...existing,
              status: request.status,
              seats: request.seats,
              message: request.message,
              passengerId: request.passengerId ?? existing.passengerId,
              passenger: request.passenger ?? existing.passenger,
            }
          : existing
      );
      return { ...ride, requests: updatedRequests, remainingSeats };
    });

    this.updateRideRemainingSeats(rideId, remainingSeats);
  }

  private applySeatRequestResponse(response: SeatRequestResponse) {
    const { rideId, remainingSeats, request } = response;
    this.updateRideRemainingSeats(rideId, remainingSeats);
    this.rides = this.rides.map((ride) =>
      ride._id === rideId
        ? {
            ...ride,
            myRequest: this.mapToPassengerRequest(request),
          }
        : ride
    );
  }

  private mapToPassengerRequest(request: RideRequestDetail): RideMyRequest {
    return {
      id: request.id,
      seats: request.seats,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
    };
  }

  private resetPassengerState() {
    this.requestStatus = {};
    this.requestMessage = {};
    this.rides = this.rides.map((ride) => ({ ...ride, myRequest: null }));
  }

  private resetDriverState() {
    this.myRides = [];
    this.myRidesLoading = false;
    this.myRidesError = '';
    this.requestActionStatus = {};
    this.requestActionMessage = {};
    this.removalStatus = {};
    this.removalMessage = {};
  }
}







