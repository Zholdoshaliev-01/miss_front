import { api } from '@/core/api/axios'
import type { Student } from './types'

export async function getStudentDetail(studentId: number) {
  const { data } = await api.get<Student>(`/students/${studentId}/`)
  return data
}
