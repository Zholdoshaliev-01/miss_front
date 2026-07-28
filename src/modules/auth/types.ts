export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  full_name: string
  phone_number: string
}

export interface AuthResponse {
  user: { username: string; email: string; role?: string }
  access: string
  refresh: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  uid: string
  token: string
  new_password: string
  confirm_password: string
}
