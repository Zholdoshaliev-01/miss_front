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
  user: {
    id: number
    username: string
    full_name?: string
    email: string
    avatar?: string | null
    role?: 'teacher' | 'student'
  }
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
