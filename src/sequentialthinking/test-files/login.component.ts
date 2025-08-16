import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLogin(): Promise<void> {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.login(this.username, this.password);
      
      if (result.success) {
        localStorage.setItem('authToken', result.token);
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = result.message || 'Login failed';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred during login';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
