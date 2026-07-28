import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudentStatus } from '@/modules/students/types'

interface StudentState {
  student_id: number | null
  group_id: number | null
  group_name: string
  status: StudentStatus | null
  setSession: (payload: {
    student_id: number
    group_id: number
    group_name: string
    status: StudentStatus
  }) => void
  clearSession: () => void
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set) => ({
      student_id: null,
      group_id: null,
      group_name: '',
      status: null,
      setSession: (payload) =>
        set({
          student_id: payload.student_id,
          group_id: payload.group_id,
          group_name: payload.group_name,
          status: payload.status,
        }),
      clearSession: () =>
        set({
          student_id: null,
          group_id: null,
          group_name: '',
          status: null,
        }),
    }),
    {
      name: 'eduflow-student',
      partialize: (state) => ({
        student_id: state.student_id,
        group_id: state.group_id,
        group_name: state.group_name,
        status: state.status,
      }),
    },
  ),
)
