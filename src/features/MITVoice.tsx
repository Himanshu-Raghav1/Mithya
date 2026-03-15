import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ThumbsUp, ThumbsDown, MessageCircle, Flag, ChevronDown, Loader2 } from 'lucide-react';
import type { ForumPost, Comment } from '../types';
import { getForumPosts, createForumPost, addComment, interactWithPost } from '../services/api';

// Nobita SVG for banner
function NobitaMini() {
  return (
    <svg viewBox="0 0 60 70" className="w-14 h-14 flex-shrink-0">
      <ellipse cx="30" cy="16" rx="18" ry="10" fill="#2d1b05" />
      <circle cx="30" cy="26" r="17" fill="#F5CBA7" />
      <rect x="17" y="22" width="10" height="7" rx="2" fill="none" stroke="#2d1b05" strokeWidth="1.5" />
      <rect x="33" y="22" width="10" height="7" rx="2" fill="none" stroke="#2d1b05" strokeWidth="1.5" />
      <line x1="27" y1="25.5" x2="33" y2="25.5" stroke="#2d1b05" strokeWidth="1.5" />
      <circle cx="22" cy="25.5" r="3" fill="#1a1a2e" />
      <circle cx="38" cy="25.5" r="3" fill="#1a1a2e" />
      <circle cx="23" cy="24.5" r="1.2" fill="white" />
      <circle cx="39" cy="24.5" r="1.2" fill="white" />
      <ellipse cx="30" cy="31" rx="2" ry="1.5" fill="#d4956a" />
      <path d="M 22 36 Q 30 42 38 36" stroke="#c0392b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="14" y="43" width="32" height="27" rx="8" fill="#2c82c9" />
    </svg>
  );
}

// Helper to get a stable anonymous ID for the current device
function getAnonymousId(): string {
  const stored = localStorage.getItem('mithya_anon_id');
  if (stored) return stored;
  
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const newId = `student_${randomNum}`;
  localStorage.setItem('mithya_anon_id', newId);
  return newId;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MITVoice() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  
  const myAnonId = getAnonymousId();

  // Load from MongoDB
  const loadPosts = async () => {
    const res = await getForumPosts();
    if (res.success && res.data) {
      setPosts(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleShare = async () => {
    if (!newText.trim()) return;
    const res = await createForumPost(newText.trim(), myAnonId);
    if (res.success) {
      setNewText('');
      loadPosts(); // refresh feed
    }
  };

  const handleLike = async (id: string, currentlyLiked: boolean) => {
    // Optimistic UI update
    setPosts(posts.map(p => {
      if (p.id !== id) return p;
      if (currentlyLiked) return { ...p, likes: p.likes - 1, likedByMe: false };
      return { ...p, likes: p.likes + 1, likedByMe: true, dislikes: p.dislikedByMe ? p.dislikes - 1 : p.dislikes, dislikedByMe: false };
    }));
    await interactWithPost(id, 'like');
  };

  const handleDislike = async (id: string, currentlyDisliked: boolean) => {
    // Optimistic UI update
    setPosts(posts.map(p => {
      if (p.id !== id) return p;
      if (currentlyDisliked) return { ...p, dislikes: p.dislikes - 1, dislikedByMe: false };
      return { ...p, dislikes: p.dislikes + 1, dislikedByMe: true, likes: p.likedByMe ? p.likes - 1 : p.likes, likedByMe: false };
    }));
    await interactWithPost(id, 'dislike');
  };

  const handleReport = async (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, reported: true } : p));
    await interactWithPost(id, 'report');
  };

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    // Optimistic UI update
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      author: myAnonId,
      text,
      timestamp: new Date().toISOString()
    };
    
    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, tempComment] } : p));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    await addComment(postId, text, myAnonId);
    loadPosts(); // Sync full state silently
  };

  return (
    <div className="p-4 space-y-4">
      {/* Nobita banner */}
      <div className="glass-card p-4 flex items-center gap-4" style={{ background: 'rgba(255,215,64,0.12)', border: '1px solid rgba(255,215,64,0.25)' }}>
        <div className="float-anim">
          <NobitaMini />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-300 font-black text-sm">⚠️ STRICT RULE</span>
          </div>
          <p className="text-white/90 text-sm font-semibold leading-relaxed">
            "Support the voice without revealing your identity.<br />
            <span className="text-yellow-200">Do not spread hate against the community.</span>"
          </p>
          <p className="text-white/50 text-xs mt-1">All usernames are anonymous. Report abusive posts.</p>
        </div>
      </div>

      {/* Compose */}
      <div className="glass-card p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Share Anonymously</p>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="What's on your mind, Mithyan? 🤔"
          rows={3}
          className="w-full p-3 rounded-xl text-white placeholder-white/30 font-medium resize-none outline-none text-sm"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}
        />
        <div className="flex justify-between items-center">
          <span className="text-white/40 text-xs">Posted as: <span className="text-blue-300 font-bold">{myAnonId}</span></span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            disabled={!newText.trim()}
            className="px-4 py-2 rounded-xl font-black text-white text-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
          >
            <Send className="w-4 h-4" />
            Share
          </motion.button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center py-10">
          <Loader2 className="w-8 h-8 text-blue-300 animate-spin mb-2" />
          <p className="text-white/50 text-sm font-semibold">Loading anonymous posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">
          <span className="text-4xl opacity-50">🤫</span>
          <p className="text-white/50 text-sm mt-3 font-semibold">No posts yet. Be the first to break the silence.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              {/* Post header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}>🎓</div>
                  <div>
                    <p className="text-white font-bold text-sm">{post.author}</p>
                    <p className="text-white/40 text-xs">{timeAgo(post.timestamp)}</p>
                  </div>
                </div>
                {post.reported ? (
                  <span className="text-xs text-red-300/60 font-bold flex items-center gap-1"><Flag className="w-3 h-3" /> Reported</span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReport(post.id)}
                    className="text-white/30 hover:text-red-400 transition-colors p-1 rounded cursor-pointer"
                    title="Report this post"
                  >
                    <Flag className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Post text */}
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-1 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLike(post.id, post.likedByMe)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                  style={{
                    background: post.likedByMe ? 'rgba(76,175,80,0.25)' : 'rgba(255,255,255,0.06)',
                    color: post.likedByMe ? '#81C784' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.likes}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDislike(post.id, post.dislikedByMe)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                  style={{
                    background: post.dislikedByMe ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.06)',
                    color: post.dislikedByMe ? '#EF9A9A' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{post.dislikes}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ml-auto"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{post.comments.length}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedComments.has(post.id) ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>

              {/* Comments section */}
              <AnimatePresence>
                {expandedComments.has(post.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-2 border-t border-white/10">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'rgba(255,215,64,0.2)' }}>✏️</div>
                          <div className="flex-1 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-300 text-xs font-bold">{c.author}</span>
                              <span className="text-white/30 text-xs">{timeAgo(c.timestamp)}</span>
                            </div>
                            <p className="text-white/80 text-xs mt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputs[post.id] ?? ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 rounded-xl text-white/80 placeholder-white/30 text-xs outline-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddComment(post.id)}
                          className="p-2 rounded-xl cursor-pointer"
                          style={{ background: 'rgba(0,168,232,0.3)' }}
                        >
                          <Send className="w-4 h-4 text-blue-300" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
