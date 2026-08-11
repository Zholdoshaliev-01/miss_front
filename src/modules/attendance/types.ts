export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export interface AttendanceRecord {
  id?: number
  date?: string
  student_id: number
  student_name?: string
  status: AttendanceStatus
  score?: number | null
  note: string
}

export interface StudentAttendanceResponse {
  count?: number
  results?: AttendanceRecord[]
  records?: AttendanceRecord[]
  attendance_percentage?: number
}

export interface AttendanceResponse {
  date?: string
  records?: AttendanceRecord[]
  results?: AttendanceRecord[]
}

export interface SaveAttendancePayload {
  date: string
  records: AttendanceRecord[]
}
