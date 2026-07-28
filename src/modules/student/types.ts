import type { StudentStatus } from '@/modules/students/types'

export interface StudentSession {
  student_id: number
  group_id: number
  group_name: string
  status: StudentStatus
}
