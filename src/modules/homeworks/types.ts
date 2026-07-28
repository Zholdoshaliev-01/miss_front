export interface Homework {
  id: number
  group: number
  title: string
  description: string
  file: string
  due_date: string
  created_at: string
  answers_count: number
  answers?: HomeworkAnswer[]
}

export interface HomeworkAnswer {
  id: number
  homework: number
  student: number
  student_name: string
  file: string
  comment: string
  submitted_at: string
  review?: Review | null
  rating?: number | null
  review_text?: string | null
  is_reviewed?: boolean
}

export interface Review {
  id: number
  user: number
  homework: number
  text: string
  rating: number
  created_date: string
}
