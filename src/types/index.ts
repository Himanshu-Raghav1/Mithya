// ============================================================
// MITHYA - Shared TypeScript Interfaces
// ============================================================

/** API response envelope from Flask */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
}

/** A comment on a MITVoice post */
export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

/** A post in the MITVoice anonymous forum */
export interface ForumPost {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  comments: Comment[];
  reported: boolean;
  image_url?: string;
}

/** An upcoming event card */
export interface EventItem {
  id: string;
  title: string;
  date: string;
  tag: EventTag;
  description: string;
  organizer: string;
  icon: string;
  url?: string;
  image_url?: string;
}

export type EventTag =
  | 'Hackathon'
  | 'Ideathon'
  | 'Club_Drive'
  | 'Volunteering'
  | 'Workshop'
  | 'Competition'
  | 'Recruitment'
  | 'Concert';

/** A contact card entry */
export interface Contact {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  phone?: string;
  category: ContactCategory;
}

export type ContactCategory =
  | 'Dean'
  | 'Faculty'
  | 'Emergency'
  | 'Admin'
  | 'Anti-Ragging'
  | 'ICC'
  | 'Grievance'
  | 'SC-ST'
  | 'Board';

/** Degree programs offered */
export type ProgramType = 'BTech' | 'BCA' | 'BBA' | 'BA' | 'B.com' | 'BSc' | 'B.des';

/** Active navigation tab IDs */
export type TabId =
  | 'voice'
  | 'events'
  | 'quicklinks'
  | 'contacts'
  | 'lostfound'
  | 'pyqs'
  | 'admin'
  | 'personalized'
  | 'pinboard'
  | 'qrgen';

/** A PYQ / Note submission */
export interface PyqNote {
  id: string;
  title: string;
  subject: string;
  author: string;
  file_url: string;
  program: ProgramType;
  semester: string;
  is_approved: boolean;
  timestamp: string;
}

/** A Lost & Found item */
export interface LostItem {
  id: string;
  item_name: string;
  description: string;
  contact_name: string;
  phone_number: string;
  type: 'Lost' | 'Found';
  image_url?: string;
  timestamp: string;
  auth_uid?: string;
}

/** A Pin Board item */
export interface PinItem {
  id: string;
  image_url: string;
  caption: string;
  timestamp: string;
}
