import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SeatRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RidePassenger {
  id: string;
  name?: string;
  email?: string;
  photo?: string;
}

export interface RideRequestDetail {
  id: string;
  passengerId?: string;
  seats: number;
  message?: string;
  status: SeatRequestStatus;
  createdAt: string;
  passenger?: RidePassenger | null;
}

export interface RideMyRequest {
  id: string;
  seats: number;
  status: SeatRequestStatus;
  message?: string;
  createdAt: string;
}

export interface RideDriver {
  _id: string;
  name?: string;
  email?: string;
  photo?: string;
}

export interface Ride {
  _id: string;
  from: string;
  to: string;
  date: string;
  seats: number;
  price: number;
  notes?: string;
  driver?: RideDriver;
  remainingSeats: number;
  myRequest?: RideMyRequest | null;
  requests?: RideRequestDetail[];
}

export interface SeatRequestPayload {
  seats?: number;
  message?: string;
}

export interface SeatRequestUpdatePayload {
  status: 'approved' | 'rejected';
}

export interface SeatRequestResponse {
  rideId: string;
  remainingSeats: number;
  request: RideRequestDetail;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  getRides(params: { from?: string; to?: string; date?: string }): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.base}/api/rides`, { params });
  }

  createRide(body: any): Observable<Ride> {
    return this.http.post<Ride>(`${this.base}/api/rides`, body);
  }

  requestSeat(rideId: string, body: SeatRequestPayload = {}): Observable<SeatRequestResponse> {
    return this.http.post<SeatRequestResponse>(`${this.base}/api/rides/${rideId}/requests`, body);
  }

  getMyRides(): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${this.base}/api/rides/mine`);
  }

  updateSeatRequest(
    rideId: string,
    requestId: string,
    body: SeatRequestUpdatePayload
  ): Observable<SeatRequestResponse> {
    return this.http.patch<SeatRequestResponse>(
      `${this.base}/api/rides/${rideId}/requests/${requestId}`,
      body
    );
  }
}
