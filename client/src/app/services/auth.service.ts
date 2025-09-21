import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  photo?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private apiBase = 'http://localhost:4000';
  private userSubject = new BehaviorSubject<AuthUser | null>(this.readStoredUser());

  readonly user$ = this.userSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    if (this.isAuthenticated() && !this.userSubject.value) {
      this.refreshUserProfile().subscribe({ error: () => {} });
    }
  }

  loginWithGoogle() {
    window.location.href = `${this.apiBase}/auth/google`;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.refreshUserProfile().subscribe({ error: () => {} });
  }

  clearToken() {
    localStorage.removeItem(this.tokenKey);
  }

  logout() {
    this.clearToken();
    this.storeUser(null);
    this.router.navigateByUrl('/');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  ensureUserLoaded(): Observable<AuthUser | null> {
    if (!this.isAuthenticated()) {
      this.storeUser(null);
      return of(null);
    }
    if (this.userSubject.value) {
      return of(this.userSubject.value);
    }
    return this.refreshUserProfile();
  }

  refreshUserProfile(): Observable<AuthUser | null> {
    if (!this.isAuthenticated()) {
      this.storeUser(null);
      return of(null);
    }

    return this.http.get<AuthUser>(`${this.apiBase}/auth/me`).pipe(
      tap((user) => this.storeUser(user)),
      catchError(() => {
        this.storeUser(null);
        return of(null);
      })
    );
  }

  private storeUser(user: AuthUser | null) {
    if (!user) {
      localStorage.removeItem(this.userKey);
    } else {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.userSubject.next(user);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch (err) {
      return null;
    }
  }
}
