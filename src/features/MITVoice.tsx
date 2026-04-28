import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ThumbsUp, ThumbsDown, MessageCircle, Flag, Loader2, Image as ImageIcon, X, Plus } from 'lucide-react';
import type { ForumPost, Comment } from '../types';
import { getForumPosts, createForumPost, addComment, interactWithPost } from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

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

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SkeletonPost = () => (
  <div className="glass-card p-4 space-y-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white/10"></div>
      <div className="space-y-2">
        <div className="w-24 h-3 bg-white/10 rounded"></div>
        <div className="w-16 h-2 bg-white/5 rounded"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="w-full h-3 bg-white/10 rounded"></div>
      <div className="w-3/4 h-3 bg-white/10 rounded"></div>
      <div className="w-5/6 h-3 bg-white/10 rounded"></div>
    </div>
    <div className="w-full h-32 bg-white/5 rounded-xl"></div>
  </div>
);

export default function MITVoice() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Compose and Expand states
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const [newText, setNewText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setFetchError(null);
    const res = await getForumPosts(token || undefined);
    if (res.success && res.data) {
      setPosts(res.data);
      setFetchError(null);
      setLoading(false);
      if (isRefresh) setIsRefreshing(false);
      return true;
    } else if (!res.success) {
      setFetchError(res.message || 'Something went wrong');
    }
    setLoading(false);
    if (isRefresh) setIsRefreshing(false);
    return false;
  };

  useEffect(() => {
    if (authLoading) return; // Wait for Supabase session check to finish

    // Fire the first attempt immediately
    loadPosts().then((success) => {
      if (!success) {
        // Auto-retry once after 8s — gives the backend time to wake up
        // The wakeup ping in main.tsx runs in parallel; by 8s the server should be warm
        setTimeout(() => {
          setLoading(true);
          setFetchError(null);
          loadPosts();
        }, 8000);
      }
    });
  }, [authLoading, token]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShare = async () => {
    if (!newText.trim() && !selectedImage) return;
    if (!user || !token) { setShowAuth(true); return; }

    setIsUploading(true);
    let uploadedUrl = undefined;

    try {
      if (selectedImage) {
        uploadedUrl = await uploadToCloudinary(selectedImage);
      }
      const res = await createForumPost(newText.trim(), token, uploadedUrl);
      if (res.success) {
        setNewText('');
        clearImage();
        setIsComposeOpen(false); // Close drawer
        loadPosts();
      } else {
        alert("Failed to post: " + res.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (id: string, currentlyLiked: boolean) => {
    if (!user || !token) { setShowAuth(true); return; }
    setPosts(posts.map(p => {
      if (p.id !== id) return p;
      if (currentlyLiked) return { ...p, likes: p.likes - 1, likedByMe: false };
      return { ...p, likes: p.likes + 1, likedByMe: true, dislikes: p.dislikedByMe ? p.dislikes - 1 : p.dislikes, dislikedByMe: false };
    }));
    await interactWithPost(id, 'like', token);
  };

  const handleDislike = async (id: string, currentlyDisliked: boolean) => {
    if (!user || !token) { setShowAuth(true); return; }
    setPosts(posts.map(p => {
      if (p.id !== id) return p;
      if (currentlyDisliked) return { ...p, dislikes: p.dislikes - 1, dislikedByMe: false };
      return { ...p, dislikes: p.dislikes + 1, dislikedByMe: true, likes: p.likedByMe ? p.likes - 1 : p.likes, likedByMe: false };
    }));
    await interactWithPost(id, 'dislike', token);
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
    if (!user || !token) { setShowAuth(true); return; }

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      author: user.anon_name,
      text,
      timestamp: new Date().toISOString()
    };

    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, tempComment] } : p));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    const res = await addComment(postId, text, token);
    if (!res.success) alert(res.message);
    loadPosts();
  };

  return (
    <div className="p-4 space-y-4">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} reason="to interact" />}

      {/* Nobita banner */}
      <div className="glass-card p-4 flex items-center gap-4" style={{ background: 'rgba(255,215,64,0.12)', border: '1px solid rgba(255,215,64,0.25)' }}>
        <div className="float-anim">
          <NobitaMini />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-300 font-black text-sm">⚠️ EACH VOICE MATTERS</span>
          </div>
          <p className="text-white/90 text-[13px] font-semibold leading-relaxed">
            "Apki awaz, supporting voice without revealing identity but strict action to community hate"
          </p>
        </div>
      </div>

      {/* FAB to compose */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsComposeOpen(true)}
        className="fixed bottom-24 right-4 z-[40] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Compose DRAWER (Bottom Sheet) */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsComposeOpen(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-[#1a1f3c] border-t border-white/20 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
              style={{
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="text-white font-black text-lg">Share Anonymously</h3>
                <button onClick={() => setIsComposeOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="text-white/60 w-5 h-5" /></button>
              </div>

              <div className="p-4 space-y-3">
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="What's on your mind, Mithyan? 🤔"
                  rows={4}
                  className="w-full p-3 rounded-xl text-white placeholder-white/30 font-medium resize-none outline-none text-sm bg-black/30 border border-white/10 focus:border-blue-400/50 transition-colors"
                />

                {previewUrl && (
                  <div className="relative inline-block w-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-32 rounded-xl object-cover border border-white/20" />
                    <button
                      onClick={clearImage} disabled={isUploading}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                    ><X className="w-4 h-4" /></button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-xs">As: <span className="text-blue-300 font-bold">{user?.anon_name ?? 'anonymous'}</span></span>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-white/50 hover:text-white p-2 bg-white/5 rounded-full border border-white/10"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    disabled={(!newText.trim() && !selectedImage) || isUploading}
                    className="px-6 py-2.5 rounded-xl font-black text-white text-sm flex items-center gap-2 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isUploading ? 'Sending...' : 'Post'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Preview */}
      <AnimatePresence>
        {expandedImage && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}>
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
            <motion.img
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              src={expandedImage}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Pull to refresh helper */}
      <div className="flex justify-center -mt-2 mb-2">
        {isRefreshing && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : fetchError ? (
        <div className="text-center py-12 space-y-4">
          <span className="text-4xl">😴</span>
          <p className="text-white/60 text-sm font-semibold px-4">{fetchError}</p>
          <button
            onClick={() => { setLoading(true); loadPosts(); }}
            className="px-6 py-2.5 rounded-xl font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
          >
            🔄 Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">
          <span className="text-4xl opacity-50">🤫</span>
          <p className="text-white/50 text-sm mt-3 font-semibold">No posts yet. Be the first to break the silence.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
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
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}>🎓</div>
                  <div>
                    <p className="text-white font-bold text-sm tracking-wide">{post.author}</p>
                    <p className="text-white/40 text-[11px] font-semibold">{timeAgo(post.timestamp)}</p>
                  </div>
                </div>
                {post.reported ? (
                  <span className="text-[10px] uppercase text-red-300/60 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-full"><Flag className="w-3 h-3" /> Reported</span>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleReport(post.id)}
                    className="text-white/20 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                  >
                    <Flag className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Post text */}
              {post.text && (
                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap px-1">{post.text}</p>
              )}

              {/* Attached Image */}
              {post.image_url && (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="mt-3 rounded-xl overflow-hidden border border-white/5 cursor-pointer"
                  onClick={() => setExpandedImage(post.image_url!)}
                >
                  <img src={post.image_url} alt="Attached" className="w-full h-auto max-h-72 object-cover bg-black/50" loading="lazy" />
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleLike(post.id, post.likedByMe)}
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl text-sm font-bold transition-colors flex-1 justify-center sm:flex-none"
                  style={{
                    background: post.likedByMe ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.04)',
                    color: post.likedByMe ? '#A5D6A7' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{post.likes}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleDislike(post.id, post.dislikedByMe)}
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl text-sm font-bold transition-colors flex-1 justify-center sm:flex-none"
                  style={{
                    background: post.dislikedByMe ? 'rgba(229,57,53,0.2)' : 'rgba(255,255,255,0.04)',
                    color: post.dislikedByMe ? '#EF9A9A' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{post.dislikes}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl text-sm font-bold transition-colors ml-auto border border-white/5 bg-white/5"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments.length}</span>
                </motion.button>
              </div>

              {/* Comments section */}
              <AnimatePresence>
                {expandedComments.has(post.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2 mt-2 border-t border-white/5">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                            {c.author.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 rounded-2xl rounded-tl-none p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-300 text-[11px] font-black tracking-wide">{c.author}</span>
                              <span className="text-white/30 text-[10px] font-semibold">{timeAgo(c.timestamp)}</span>
                            </div>
                            <p className="text-white/90 text-[13px] mt-1 pr-2">{c.text}</p>
                          </div>
                        </div>
                      ))}

                      {/* Comment input */}
                      <div className="flex gap-2 pt-2 items-center">
                        <input
                          type="text"
                          value={commentInputs[post.id] ?? ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Write anonymously..."
                          className="flex-1 px-4 min-h-[44px] rounded-full text-white/90 placeholder-white/30 text-[13px] outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => handleAddComment(post.id)}
                          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors"
                          style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}
                        >
                          <Send className="w-4 h-4 text-white" />
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
