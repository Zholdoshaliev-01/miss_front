export interface UserProfile {
  id: number
  username: string
  full_name: string
  email: string
  avatar: string
  phone_number: string
  bio: string
  role: 'teacher' | 'student'
  register_date: string
}
