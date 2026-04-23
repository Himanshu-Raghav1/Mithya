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
import type { ApiResponse, ForumPost, Comment } from '../types';


// ==========================================
// 🗣️ MITVOICE (MONGODB API)
// ==========================================

export async function getForumPosts(token?: string): Promise<ApiResponse<ForumPost[]>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/voice/posts`, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    return await res.json() as ApiResponse<ForumPost[]>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { success: false, message: 'Server took too long to respond. It may be starting up — tap Retry.' };
    }
    return { success: false, message: 'Failed to fetch posts. Check your connection.' };
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

export async function getLostFoundStats(): Promise<ApiResponse<{ solved_cases: number }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lostfound/stats`);
    return await res.json() as ApiResponse<{ solved_cases: number }>;
  } catch {
    return { success: false, message: 'Failed to fetch stats' };
  }
}

export async function resolveLostFoundItem(itemId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lostfound/${itemId}/solve`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to resolve item' };
  }
}

export async function adminResolveLostFoundItem(itemId: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/lostfound/${itemId}/solve`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to resolve item' };
  }
}

// ==========================================
// 🎟️ EVENTS (MONGODB API)
// ==========================================

export async function getEvents(): Promise<ApiResponse<import('../types').EventItem[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`);
    return await res.json() as ApiResponse<import('../types').EventItem[]>;
  } catch {
    return { success: false, message: 'Failed to fetch events' };
  }
}

export async function createEvent(payload: Partial<import('../types').EventItem>): Promise<ApiResponse<import('../types').EventItem>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
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
    const res = await fetch(`${API_BASE_URL}/api/admin/activities/${eventId}`, {
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

export async function submitPyq(payload: any, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pyqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Failed to submit note' };
  }
}

export async function starNote(noteId: string, reason: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pyqs/${noteId}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason })
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Failed to give star' };
  }
}

export async function getLegendResources(
  program?: string,
  semester?: string,
  search?: string
): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (program && program !== 'All') params.append('program', program);
    if (semester && semester !== 'All') params.append('semester', semester);
    if (search && search.trim()) params.append('search', search.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/legend${query}`);
    return await res.json() as ApiResponse<any[]>;
  } catch {
    return { success: false, message: 'Failed to fetch legend resources' };
  }
}

export async function submitLegendResource(payload: any, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/legend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Failed to submit legend resource' };
  }
}

export async function starLegendResource(resourceId: string, reason: string, token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/legend/${resourceId}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason })
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: 'Failed to give star' };
  }
}

export async function getPendingLegend(token: string): Promise<ApiResponse<any[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/pending_legend`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json() as ApiResponse<any[]>;
  } catch {
    return { success: false, message: 'Failed to fetch pending legend resources' };
  }
}

export async function moderateLegend(resourceId: string, action: 'approve' | 'reject', token: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/legend/${resourceId}/${action}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json() as ApiResponse<any>;
  } catch {
    return { success: false, message: `Failed to ${action} legend resource` };
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
