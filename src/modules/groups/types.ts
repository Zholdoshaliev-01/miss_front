export interface Group {
  id: number
  group_name: string
  group_image: string | null
  level: string
  invite_code: string
  created_date: string
  students_count: number | string
  // These fields only exist in GroupDetail response, not GroupList
  materials_count?: number | string
  homeworks_count?: number | string
  tests_count?: number | string
}
