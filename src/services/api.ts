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

export async function getForumPosts(): Promise<ApiResponse<ForumPost[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/posts`);
    return await res.json() as ApiResponse<ForumPost[]>;
  } catch {
    return { success: false, message: 'Failed to fetch posts' };
  }
}

export async function createForumPost(text: string, author: string): Promise<ApiResponse<ForumPost>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author })
    });
    return await res.json() as ApiResponse<ForumPost>;
  } catch {
    return { success: false, message: 'Failed to create post' };
  }
}

export async function addComment(postId: string, text: string, author: string): Promise<ApiResponse<Comment>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author })
    });
    return await res.json() as ApiResponse<Comment>;
  } catch {
    return { success: false, message: 'Failed to add comment' };
  }
}

export async function interactWithPost(postId: string, action: 'like' | 'dislike' | 'report'): Promise<ApiResponse<void>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/posts/${postId}/${action}`, {
      method: 'PUT'
    });
    return await res.json() as ApiResponse<void>;
  } catch {
    return { success: false, message: 'Failed to interact with post' };
  }
}
