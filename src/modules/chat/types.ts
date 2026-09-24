/* ─── Room ─── */
export interface RoomOut {
  id: number
  group_id: number
  owner_id: number
  title: string
  description: string | null
  image_url?: string | null
  is_private: boolean
  is_active: boolean
  created_at: string
}

/* ─── Members ─── */
export interface MemberOut {
  id: number
  user_id: number
  username?: string
  full_name?: string
  email?: string
  role?: 'teacher' | 'student'
  avatar?: string | null
  is_online: boolean
  joined_at: string
  last_seen: string | null
}

/* ─── Message ─── */
export interface MessageCreate {
  text: string
}

export interface MessageOut {
  id: number
  room_id: number
  group_id?: number
  sender_id: number
  sender_name: string
  sender_avatar?: string | null
  is_teacher: boolean
  text: string
  is_deleted: boolean
  edited_at: string | null
  created_at: string
  attachments?: AttachmentOut[]
  status?: string
}

export interface ChatUserSummary {
  id: number
  username: string
  full_name?: string
  email?: string
  role?: 'teacher' | 'student'
  avatar?: string | null
}

export interface MessageEdit {
  text: string
}

/* ─── Attachment ─── */
export interface AttachmentOut {
  id: number
  file_type: string
  file_url: string
  file_name: string
  original_name?: string
  url?: string
  mime_type: string
  file_size: number
  duration_sec: number | null
  created_at: string
  localPreviewUrl?: string
}

export interface AttachmentUploadResponse {
  message_id: number
  attachment: AttachmentOut
}

/* ─── Read State ─── */
export interface ReadStateOut {
  id: number
  room_id: number
  user_id: number
  last_read_message_id: number | null
  updated_at: string
}
