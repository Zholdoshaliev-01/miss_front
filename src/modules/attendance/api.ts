import { api } from '@/core/api/axios'
import type { AttendanceRecord, AttendanceResponse, SaveAttendancePayload, StudentAttendanceResponse } from './types'

export async function getAttendance(groupId: number, date?: string, month?: string) {
  const { data } = await api.get<AttendanceResponse | AttendanceRecord[]>(`/groups/${groupId}/attendance/`, {
    params: {
      ...(date ? { date } : {}),
      ...(month ? { month } : {}),
    },
  })
  return data
}

export async function saveAttendance(groupId: number, payload: SaveAttendancePayload) {
  const { data } = await api.post<AttendanceResponse>(`/groups/${groupId}/attendance/`, payload)
  return data
}

export async function getStudentAttendance(groupId: number) {
  const { data } = await api.get<StudentAttendanceResponse | AttendanceRecord[]>(`/student/groups/${groupId}/attendance/`)
  return data
}
