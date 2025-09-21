import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styles: [
    `.container{max-width:800px;margin:0 auto;padding:16px}`,
    `.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}`,
    `.search form{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}`,
    `input{padding:8px;border:1px solid #ccc;border-radius:4px}`,
    `button{padding:8px 12px}`,
    `.user-actions{display:flex;align-items:center;gap:8px}`,
    `.ride-actions{margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}`,
    `.ride-feedback{font-size:0.9rem}`,
    `.ride-feedback.error{color:#c0392b}`,
    `.ride-feedback.success{color:#1e8449}`,
    `.ride-status{display:flex;flex-direction:column;gap:2px}`,
    `.status-text{font-size:0.85rem;color:#555}`,
    `.driver-section{margin-top:32px}`,
    `.driver-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}`,
    `.ride-card{border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px}`,
    `.ride-card-header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}`,
    `.ride-card-meta{margin-top:4px;font-size:0.9rem;color:#555}`,
    `.request-list{list-style:none;padding:0;margin:12px 0 0}`,
    `.request-item{padding:12px 0;border-top:1px solid #eee;display:flex;flex-direction:column;gap:4px}`,
    `.request-item:first-child{border-top:none}`,
    `.request-info{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}`,
    `.subtle{color:#666;font-size:0.85rem}`,
    `.badge{padding:2px 8px;border-radius:999px;font-size:0.75rem;text-transform:capitalize;background:#e5e7eb}`,
    `.badge.pending{background:#f9e79f}`,
    `.badge.approved{background:#d4efdf}`,
    `.badge.rejected{background:#f5b7b1}`,
    `.request-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px}`,
    `.resolved-label{font-size:0.85rem;color:#555}`,
    `.empty-state{color:#666;font-size:0.9rem}`,
    `.driver-error{color:#c0392b;font-size:0.9rem;margin-bottom:12px}`,
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
