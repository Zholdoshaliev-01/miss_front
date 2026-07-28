export type StudentStatus = 'active' | 'pending' | 'rejected' | 'expelled'

export interface Student {
  id: number
  full_name: string
  email: string
  group: number
  group_name: string
  group_level: string
  status: StudentStatus
  joined_at: string
  rating?: { rank: number; note: string }
  homework_answers_count?: number
}
