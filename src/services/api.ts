// ============================================================
// MITHYA - API Service Layer
// ============================================================
// All backend calls are centralized here.
//
// BACKEND SECURITY REMINDERS (for app.py / Azure App Service):
// 1. Restrict CORS origins before production:
//    CORS(app, origins=["https://<your-app>.azurestaticapps.net"])
//    Do NOT leave CORS(app) open — it allows any site to hit your DB.
//
// 2. Add rate limiting to prevent API spam on Azure:
//    pip install flask-limiter
//    from flask_limiter import Limiter
//    limiter = Limiter(app, default_limits=["100 per hour"])
//
// 3. NEVER store MONGO_URI or secrets in the frontend.
// ============================================================

import { API_BASE_URL, API_TIMEOUT_MS } from '../config/api';
import type { SlotResult, ApiResponse, ForumPost, Comment } from '../types';

/** Search for open sports slots by game name */
export async function searchSportsSlots(game: string): Promise<ApiResponse<SlotResult[]>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const url = `${API_BASE_URL}/api/search?game=${encodeURIComponent(game.trim())}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json() as ApiResponse<SlotResult[]>;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timed out. The server might be busy — please try again.',
      };
    }
    return {
      success: false,
      message: 'Could not connect to the server. Make sure the backend is running.',
    };
  }
}

// ==========================================
// 🗣️ MITVOICE (MONGODB API)
// ==========================================

export async function getForumPosts(token?: string): Promise<ApiResponse<ForumPost[]>> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/voice/posts`, { headers });
    return await res.json() as ApiResponse<ForumPost[]>;
  } catch {
    return { success: false, message: 'Failed to fetch posts' };
  }
}

export async function createForumPost(text: string, token: string, image_url?: string): Promise<ApiResponse<ForumPost>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text, image_url })  // author comes from JWT on backend
    });
    return await res.json() as ApiResponse<ForumPost>;
  } catch {
    return { success: false, message: 'Failed to create post' };
  }
}

export async function addComment(postId: string, text: string, token: string): Promise<ApiResponse<Comment>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text })
    });
    return await res.json() as ApiResponse<Comment>;
  } catch {
    return { success: false, message: 'Failed to add comment' };
  }
}

export async function interactWithPost(postId: string, action: 'like' | 'dislike' | 'report', token?: string): Promise<ApiResponse<void>> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/voice/posts/${postId}/${action}`, {
      method: 'PUT',
      headers
    });
    return await res.json() as ApiResponse<void>;
  } catch {
    return { success: false, message: 'Failed to interact with post' };
  }
}

// ==========================================
// 🧳 LOST & FOUND (MONGODB API)
// ==========================================

export async function getLostFoundItems(): Promise<ApiResponse<any[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lostfound`);
    return await res.json() as ApiResponse<any[]>;
  } catch {
    return { success: false, message: 'Failed to fetch items' };
  }
}

export async function createLostFoundItem(payload: any, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lostfound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Failed to report item' };
  }
}

// ==========================================
// 🎟️ EVENTS (MONGODB API)
// ==========================================

export async function getEvents(): Promise<ApiResponse<import('../types').EventItem[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`);
    return await res.json() as ApiResponse<import('../types').EventItem[]>;
  } catch {
    return { success: false, message: 'Failed to fetch events' };
  }
}

export async function createEvent(payload: Partial<import('../types').EventItem>): Promise<ApiResponse<import('../types').EventItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json() as ApiResponse<import('../types').EventItem>;
  } catch {
    return { success: false, message: 'Failed to create event' };
  }
}

export async function deleteEvent(eventId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to delete event' };
  }
}

// ==========================================
// 📌 PIN BOARD
// ==========================================

export async function getPinboard(): Promise<ApiResponse<import('../types').PinItem[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pinboard`);
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to fetch pin board' };
  }
}

export async function createPin(image_url: string, caption: string, token: string): Promise<ApiResponse<import('../types').PinItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/pinboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ image_url, caption })
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to create pin' };
  }
}

export async function deletePin(pinId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/pinboard/${pinId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to delete pin' };
  }
}

// ==========================================
// 📚 PYQs & NOTES + ADMIN (MONGODB API)
// ==========================================

export async function getPyqs(
  program?: string,
  semester?: string,
  category?: string,
  search?: string
): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (program && program !== 'All') params.append('program', program);
    if (semester && semester !== 'All') params.append('semester', semester);
    if (category && category !== 'All') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/pyqs${query}`);
    return await res.json() as ApiResponse<any[]>;
  } catch {
    return { success: false, message: 'Failed to fetch notes' };
  }
}

export async function submitPyq(payload: any): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pyqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Failed to submit note' };
  }
}

export async function verifyAdmin(username: string, password: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() })
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Server error' };
  }
}

export async function getPendingPyqs(token: string): Promise<ApiResponse<any[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/pending_pyqs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json() as ApiResponse<any[]>;
  } catch {
    return { success: false, message: 'Failed to fetch pending notes' };
  }
}

export async function moderatePyq(noteId: string, action: 'approve' | 'reject', token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/pyqs/${noteId}/${action}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: `Failed to ${action} note` };
  }
}

export async function deleteVoicePost(postId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/voice/posts/${postId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to delete post' };
  }
}

export async function deleteVoiceComment(postId: string, commentId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/voice/posts/${postId}/comments/${commentId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to delete comment' };
  }
}

export async function getContacts(): Promise<ApiResponse<import('../types').Contact[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/contacts`);
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to fetch contacts' };
  }
}

export async function createContact(payload: Partial<import('../types').Contact>, token: string): Promise<ApiResponse<import('../types').Contact>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to create contact' };
  }
}

export async function deleteContact(contactId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/contacts/${contactId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to delete contact' };
  }
}

// ==========================================
// 🔐 PRIVATE SPACE (DEADLINES & UR MONEY)
// ==========================================

export async function getPrivateDeadlines(token: string): Promise<ApiResponse<any[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/private/deadlines`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to fetch deadlines' };
  }
}

export async function submitPrivateDeadline(payload: any, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/private/deadlines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to save deadline' };
  }
}

export async function deletePrivateDeadline(dlId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/private/deadlines/${dlId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to delete' };
  }
}

export async function getUrMoney(token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/private/finance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to fetch finance' };
  }
}

export async function setUrMoneyBudget(budget: number, month_start: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/private/finance/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ budget, month_start })
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to set budget' };
  }
}

export async function addUrMoneyExpense(title: string, amount: number, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/private/finance/expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, amount })
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to add expense' };
  }
}
