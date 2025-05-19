export interface UserInterface {
  email: string;

  password: string;

  name: string;

  role: string;

  lastLoggedIn: Date;

  loginAttempts: number;

  isActive: boolean;
}
