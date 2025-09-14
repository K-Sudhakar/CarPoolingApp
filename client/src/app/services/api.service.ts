import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  getRides(params: { from?: string; to?: string; date?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/api/rides`, { params });
  }

  createRide(body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/api/rides`, body);
  }
}

