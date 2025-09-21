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
import {
  ApiService,
  Ride,
  RideMyRequest,
  RideRequestDetail,
  SeatRequestResponse,
  SeatRequestStatus,
} from '../services/api.service';
import { AuthService } from '../services/auth.service';

type RequestUiState = 'idle' | 'loading' | 'success' | 'error';
type DriverRideRequest = RideRequestDetail & { key: string };
type DriverRide = Omit<Ride, 'requests' | 'myRequest'> & { requests: DriverRideRequest[] };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatToolbarModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatChipsModule, MatDividerModule],
  templateUrl: './home.component.html',
  styles: [
    `.app-shell{display:flex;flex-direction:column;min-height:100vh;background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,251,0.9));}`,
    `.app-toolbar{padding:0 24px;}`,
    `.app-title{font-weight:600;font-size:1.4rem;}`,
    `.toolbar-spacer{flex:1 1 auto;}`,
    `.user-actions{display:flex;align-items:center;gap:12px;}`,
    `.content{flex:1;padding:32px 16px;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:24px;}`,
    `.search-card,.results-card,.driver-card{border-radius:16px;overflow:hidden;}`,
    `.search-form{display:flex;flex-direction:column;gap:16px;}`,
    `.search-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}`,
    `.search-actions{display:flex;justify-content:flex-end;}`,
    `.rides-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}`,
    `.ride-card{border-radius:16px;display:flex;flex-direction:column;gap:8px;}`,
    `.ride-meta{margin-bottom:8px;}`,
    `.meta-chip-set{display:flex;flex-wrap:wrap;gap:8px;}`,
    `.meta-chip-set mat-chip{font-weight:500;}`,
    `.badge-chip{background-color:#edf2ff;color:#1f2933;}`,
    `.badge-chip.low{background-color:#fde68a;color:#92400e;}`,
    `.badge-chip.pending{background-color:#fde68a;color:#92400e;}`,
    `.badge-chip.approved{background-color:#dcfce7;color:#166534;}`,
    `.badge-chip.rejected{background-color:#fee2e2;color:#b91c1c;}`,
    `.ride-driver{margin-top:4px;}`,
    `.ride-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:16px;}`,
    `.inline-feedback{font-size:0.85rem;}`,
    `.inline-feedback.error{color:#c62828;}`,
    `.inline-feedback.success{color:#2e7d32;}`,
    `.status-wrapper{display:flex;align-items:center;gap:8px;}`,
    `.status-text{font-size:0.85rem;color:#4b5563;}`,
    `.login-prompt{padding:16px;}`,
    `.empty-state{padding:24px;text-align:center;color:#6b7280;}`,
    `.driver-actions{display:flex;justify-content:flex-end;margin-bottom:16px;}`,
    `.driver-rides{display:flex;flex-direction:column;gap:16px;}`,
    `.driver-ride-card{border-radius:16px;}`,
    `.request-list{display:flex;flex-direction:column;gap:12px;margin-top:16px;}`,
    `.request-item{border:1px solid #e0e7ff;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;}`,
    `.request-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}`,
    `.request-name{font-weight:600;}`,
    `.driver-controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px;}`,
    `.resolved-label{font-size:0.9rem;color:#4b5563;}`,
    `.driver-error{color:#c62828;margin-bottom:12px;}`,
    `.subtle{color:#6b7280;font-size:0.9rem;}`,
    `.content section mat-card-header{align-items:flex-start;}`,
    `@media (max-width:600px){.content{padding:24px 12px;}.ride-actions{padding:16px 0;}.driver-actions{justify-content:stretch;}.driver-actions button{width:100%;}}`,
  ],
})
export class HomeComponent implements OnInit {
  from = '';
  to = '';
  date = '';
  rides: Ride[] = [];
  myRides: DriverRide[] = [];
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

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
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
  }
}

