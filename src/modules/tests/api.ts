import { api } from '@/core/api/axios'
import type { CourseTest, TestQuestion, TestAnswer, StudentTestResult } from './types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/* ─── Teacher: Course Tests CRUD ─── */

export async function getTests(groupId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<CourseTest>>(`/groups/${groupId}/tests/`, { params })
  return data
}

export async function getTestDetail(testId: number) {
  const { data } = await api.get<CourseTest>(`/tests/${testId}/`)
  return data
}

export async function createTest(payload: { group: number; title: string; description?: string }) {
  const { data } = await api.post<CourseTest>('/coursetests/', payload)
  return data
}

export async function updateTest(testId: number, payload: Partial<{ title: string; description: string }>) {
  const { data } = await api.patch<CourseTest>(`/coursetests/${testId}/`, payload)
  return data
}

export async function deleteTest(testId: number) {
  await api.delete(`/coursetests/${testId}/`)
}

/* ─── Teacher: Questions CRUD ─── */

export async function getTestQuestions(testId: number) {
  const { data } = await api.get<TestQuestion[]>(`/tests/${testId}/questions/`)
  return data
}

export async function createTestQuestion(testId: number, payload: { text: string; points?: number }) {
  const { data } = await api.post<TestQuestion>(`/tests/${testId}/questions/`, payload)
  return data
}

export async function updateTestQuestion(testId: number, questionId: number, payload: Partial<{ text: string; points: number }>) {
  const { data } = await api.patch<TestQuestion>(`/tests/${testId}/questions/${questionId}/`, payload)
  return data
}

export async function deleteTestQuestion(testId: number, questionId: number) {
  await api.delete(`/tests/${testId}/questions/${questionId}/`)
}

/* ─── Teacher: Answers CRUD ─── */

export async function getQuestionAnswers(questionId: number) {
  const { data } = await api.get<TestAnswer[]>(`/questions/${questionId}/answers/`)
  return data
}

export async function createQuestionAnswer(questionId: number, payload: { text: string; is_correct?: boolean }) {
  const { data } = await api.post<TestAnswer>(`/questions/${questionId}/answers/`, payload)
  return data
}

export async function updateQuestionAnswer(questionId: number, answerId: number, payload: Partial<{ text: string; is_correct: boolean }>) {
  const { data } = await api.patch<TestAnswer>(`/questions/${questionId}/answers/${answerId}/`, payload)
  return data
}

export async function deleteQuestionAnswer(questionId: number, answerId: number) {
  await api.delete(`/questions/${questionId}/answers/${answerId}/`)
}

/* ─── Teacher: Test Results ─── */

export async function getTestResults(testId: number, params?: Record<string, string>) {
  const { data } = await api.get<PaginatedResponse<StudentTestResult>>(`/tests/${testId}/results/`, { params })
  return data
}

/* ─── Student: Test endpoints ─── */

export interface StudentTestView {
  id: number
  title: string
  description: string
  created_at: string
  questions: {
    id: number
    text: string
    points: number
    answers: { id: number; text: string }[]
  }[]
}

export async function getStudentTestDetail(testId: number) {
  const { data } = await api.get<StudentTestView>(`/student/tests/${testId}/`)
  return data
}

export async function startStudentTest(testId: number) {
  const { data } = await api.post(`/student/tests/${testId}/start/`)
  return data
}

export async function submitStudentTest(resultId: number, answers: { question_id: number; answer_id: number }[]) {
  const { data } = await api.post(`/student/test-results/${resultId}/submit/`, { answers })
  return data
}

export async function getTestReview(resultId: number) {
  const { data } = await api.get(`/test-results/${resultId}/review/`)
  return data
}
