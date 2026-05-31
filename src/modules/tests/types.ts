export interface CourseTest {
  id: number
  group: number
  title: string
  description: string
  created_at: string
  questions_count: number
  questions?: TestQuestion[]
}

export interface TestQuestion {
  id: number
  test: number
  text: string
  points: number
  answers?: TestAnswer[]
}

export interface TestAnswer {
  id: number
  question: number
  text: string
  is_correct?: boolean
}

export interface StudentTestResult {
  id: number
  test: number
  student: number
  score: number
  max_score: number
  percentage: number
  taken_at: string
  attempt_number?: number
  status?: 'in_progress' | 'submitted' | 'expired'
  started_at?: string
  submitted_at?: string
}

export interface StudentTestAnswerReview {
  question_id: number
  question_text: string
  selected_answer_id: number
  correct_answer_id: number
  is_correct: boolean
  points: number
}
