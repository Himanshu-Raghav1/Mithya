import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Upload, Loader2, Link as LinkIcon, Download, Search, X,
  Lock, Star, Share2, ExternalLink, Trophy, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import {
  getPyqs, submitPyq, starNote,
  getLegendResources, submitLegendResource, starLegendResource
} from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';
import type { ProgramType } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

// ─── Doraemon SVG ────────────────────────────────────────────────────────────
function DoraemonReading() {
  return (
    <svg viewBox="0 0 150 160" className="w-20 h-20 flex-shrink-0">
      <rect x="20" y="115" width="110" height="35" rx="6" fill="#FFD740" />
      <line x1="75" y1="115" x2="75" y2="150" stroke="#E65100" strokeWidth="2.5" />
      <ellipse cx="75" cy="105" rx="44" ry="22" fill="#00A8E8" />
      <circle cx="75" cy="60" r="44" fill="#00A8E8" />
      <ellipse cx="75" cy="68" rx="32" ry="26" fill="white" />
      <circle cx="75" cy="70" r="6" fill="#E53935" />
      <path d="M 58 80 Q 75 92 92 80" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <line x1="34" y1="72" x2="58" y2="75" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="34" y1="80" x2="58" y2="80" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="92" y1="75" x2="116" y2="72" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="92" y1="80" x2="116" y2="80" stroke="#1a1a2e" strokeWidth="1.5" />
      <rect x="44" y="101" width="62" height="7" rx="3.5" fill="#E53935" />
      <circle cx="75" cy="104.5" r="4.5" fill="#FFD740" />
      <ellipse cx="62" cy="59" rx="8" ry="7" fill="white" />
      <ellipse cx="88" cy="59" rx="8" ry="7" fill="white" />
      <ellipse cx="62" cy="62" rx="5" ry="4" fill="#1a1a2e" />
      <ellipse cx="88" cy="62" rx="5" ry="4" fill="#1a1a2e" />
      <circle cx="36" cy="33" r="12" fill="#00A8E8" />
      <circle cx="114" cy="33" r="12" fill="#00A8E8" />
      <path d="M 32 100 Q 26 115 30 130" stroke="#00A8E8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 118 100 Q 124 115 120 130" stroke="#00A8E8" strokeWidth="8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROGRAMS: ProgramType[] = ['BTech', 'BCA', 'BBA', 'BA', 'B.com', 'BSc', 'B.des'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const CATEGORIES = ['PYQs', 'Notes', 'PPT or PDF'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonPYQItem = () => (
  <div className="glass-card p-5 border border-white/10 animate-pulse bg-white/5">
    <div className="flex justify-between items-start mb-3 gap-2">
      <div className="flex flex-col gap-1 w-full">
        <div className="w-20 h-5 bg-white/10 rounded-full"></div>
        <div className="flex gap-1.5 mt-1">
          <div className="w-12 h-4 bg-white/10 rounded"></div>
          <div className="w-12 h-4 bg-white/10 rounded"></div>
        </div>
      </div>
      <div className="w-16 h-3 bg-white/10 rounded"></div>
    </div>
    <div className="w-3/4 h-5 bg-white/10 rounded mb-4 mt-2"></div>
    <div className="flex items-center justify-between mt-6">
      <div className="w-24 h-3 bg-white/10 rounded"></div>
      <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
    </div>
  </div>
);

// ─── Star Reason Modal ────────────────────────────────────────────────────────
interface StarModalProps {
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting: boolean;
}
function StarReasonModal({ onClose, onSubmit, isSubmitting }: StarModalProps) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative w-full max-w-md glass-card border border-yellow-400/30 p-5 rounded-2xl z-10"
        style={{ background: '#111827' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <h3 className="text-base font-black text-white">Give a Student Star ⭐</h3>
        </div>
        <p className="text-white/50 text-xs mb-3 leading-relaxed">
          Tell others how this resource helped you. Your reason will be visible to all students.
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="e.g. Covered all 2024 end-sem questions perfectly, helped me score 90+..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition-colors resize-none placeholder-white/30"
        />
        <div className="flex items-center justify-between mt-1 mb-4">
          <span className={`text-[10px] ${reason.trim().length < 10 ? 'text-red-400' : 'text-white/30'}`}>
            {reason.trim().length < 10 ? `${10 - reason.trim().length} more chars needed` : `${reason.trim().length}/300`}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-white/60 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            disabled={!valid || isSubmitting}
            onClick={() => onSubmit(reason.trim())}
            className="flex-1 py-2.5 rounded-xl text-sm font-black bg-yellow-400 text-black hover:bg-yellow-300 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4 fill-black" /> Give ⭐</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stars Reasons Panel ──────────────────────────────────────────────────────
interface StarsLogPanelProps {
  starsLog: { anon_name: string; reason: string; timestamp: string }[];
  total: number;
  onClose: () => void;
}
function StarsLogPanel({ starsLog, total, onClose }: StarsLogPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative w-full max-w-md glass-card border border-yellow-400/20 rounded-2xl z-10 max-h-[70vh] flex flex-col"
        style={{ background: '#111827' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h3 className="font-black text-white">⭐ {total} Stars — Why students love this</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/5 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3">
          {starsLog.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">No stars yet. Be the first!</p>
          ) : (
            [...starsLog].reverse().map((entry, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-yellow-400 font-bold text-xs">{entry.anon_name}</span>
                  <span className="text-white/30 text-[10px]">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">"{entry.reason}"</p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Share helper ─────────────────────────────────────────────────────────────
async function handleShare(title: string, url: string, setCopied: (v: boolean) => void) {
  if (navigator.share) {
    try { await navigator.share({ title, url }); return; } catch { /* user cancelled */ }
  }
  await navigator.clipboard.writeText(url);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({ note, token, onStar }: { note: any; token: string | null; onStar: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [starring, setStarring] = useState(false);
  const [copied, setCopied] = useState(false);

  const doStar = async (reason: string) => {
    if (!token) return;
    setStarring(true);
    const res = await starNote(note.id, reason, token);
    setStarring(false);
    if (res.success) {
      setShowModal(false);
      onStar(note.id);
    } else {
      alert(res.message);
    }
  };

  return (
    <>
      <div className="glass-card p-5 border border-white/10 hover:border-yellow-400/40 transition-colors group flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex flex-col gap-1">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 w-max">
              {note.subject}
            </span>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {note.program && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-500/15 text-yellow-300 border border-yellow-500/25">{note.program}</span>}
              {note.semester && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/25">Sem {note.semester}</span>}
              {note.category && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/15 text-green-300 border border-green-500/25">{note.category}</span>}
            </div>
          </div>
          <span className="text-xs text-white/30 shrink-0">{new Date(note.timestamp).toLocaleDateString()}</span>
        </div>

        <h3 className="text-base font-black text-white mb-3 line-clamp-2 flex-1">{note.title}</h3>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
          <span className="text-xs text-white/50">
            By: <span className="font-bold text-yellow-400">{note.author || 'Anonymous'}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {/* Star count / reasons */}
            <button
              onClick={() => setShowLog(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 transition-colors text-xs font-bold"
            >
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {note.stars || 0}
            </button>

            {/* Give star (auth only) */}
            {token && (
              <button
                onClick={() => setShowModal(true)}
                title="Give a Star"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-400/20 text-white/50 hover:text-yellow-300 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Share */}
            <button
              onClick={() => handleShare(note.title, note.file_url, setCopied)}
              title={copied ? 'Copied!' : 'Share'}
              className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'}`}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Download / Open */}
            <a
              href={note.file_url} target="_blank" rel="noreferrer"
              className="p-1.5 bg-white/10 hover:bg-yellow-400/20 text-white hover:text-yellow-300 rounded-lg transition-colors"
              title="Open / Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <StarReasonModal
            onClose={() => setShowModal(false)}
            onSubmit={doStar}
            isSubmitting={starring}
          />
        )}
        {showLog && (
          <StarsLogPanel
            starsLog={note.stars_log || []}
            total={note.stars || 0}
            onClose={() => setShowLog(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Legend Card ──────────────────────────────────────────────────────────────
function LegendCard({ resource, token, onStar }: { resource: any; token: string | null; onStar: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [starring, setStarring] = useState(false);
  const [copied, setCopied] = useState(false);

  const doStar = async (reason: string) => {
    if (!token) return;
    setStarring(true);
    const res = await starLegendResource(resource.id, reason, token);
    setStarring(false);
    if (res.success) {
      setShowModal(false);
      onStar(resource.id);
    } else {
      alert(res.message);
    }
  };

  return (
    <>
      <div
        className="glass-card p-5 border flex flex-col"
        style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
      >
        {/* Legend badge */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Legend Resource</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {resource.subject}
          </span>
        </div>

        <h3 className="text-base font-black text-white mb-1 line-clamp-2">{resource.title}</h3>

        {resource.description && (
          <p className="text-white/50 text-xs leading-relaxed mb-3 line-clamp-2">{resource.description}</p>
        )}

        <div className="flex gap-1.5 flex-wrap mb-3">
          {resource.program && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-500/15 text-yellow-300 border border-yellow-500/25">{resource.program}</span>}
          {resource.semester && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/25">Sem {resource.semester}</span>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t mt-auto" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
          <div>
            <p className="text-[10px] text-white/40">Legend: <span className="text-amber-300 font-black">{resource.legend_name}</span></p>
            <p className="text-[10px] text-white/30">Shared by: {resource.submitter_name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Star count */}
            <button
              onClick={() => setShowLog(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 transition-colors text-xs font-bold"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {resource.stars || 0}
            </button>

            {token && (
              <button onClick={() => setShowModal(true)} title="Give a Star"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-400/20 text-white/50 hover:text-amber-300 transition-colors">
                <Star className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => handleShare(resource.title, resource.drive_link, setCopied)}
              title={copied ? 'Copied!' : 'Share'}
              className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'}`}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <a href={resource.drive_link} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 transition-colors" title="Open Drive Link">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <StarReasonModal onClose={() => setShowModal(false)} onSubmit={doStar} isSubmitting={starring} />}
        {showLog && <StarsLogPanel starsLog={resource.stars_log || []} total={resource.stars || 0} onClose={() => setShowLog(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PYQsNotes() {
  const { user, token } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'legend' | 'upload'>('feed');

  // Feed state
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Legend state
  const [legendItems, setLegendItems] = useState<any[]>([]);
  const [isLegendLoading, setIsLegendLoading] = useState(true);

  // Upload form — Note
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [author, setAuthor] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadProgram, setUploadProgram] = useState<ProgramType>('BTech');
  const [uploadSemester, setUploadSemester] = useState('1');
  const [uploadCategory, setUploadCategory] = useState('PYQs');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form — Legend Resource
  const [lgTitle, setLgTitle] = useState('');
  const [lgDriveLink, setLgDriveLink] = useState('');
  const [lgLegendName, setLgLegendName] = useState('');
  const [lgSubject, setLgSubject] = useState('');
  const [lgDescription, setLgDescription] = useState('');
  const [lgProgram, setLgProgram] = useState<ProgramType>('BTech');
  const [lgSemester, setLgSemester] = useState('1');
  const [isLegendUploading, setIsLegendUploading] = useState(false);
  const [uploadSubTab, setUploadSubTab] = useState<'note' | 'legend'>('note');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const res = await getPyqs(selectedProgram, selectedSemester, selectedCategory, debouncedSearch);
    setNotes(res.success && res.data ? res.data : []);
    setIsLoading(false);
  }, [selectedProgram, selectedSemester, selectedCategory, debouncedSearch]);

  const loadLegend = useCallback(async () => {
    setIsLegendLoading(true);
    const res = await getLegendResources();
    setLegendItems(res.success && res.data ? res.data : []);
    setIsLegendLoading(false);
  }, []);

  useEffect(() => { if (activeTab === 'feed') loadNotes(); }, [activeTab, loadNotes]);
  useEffect(() => { if (activeTab === 'legend') loadLegend(); }, [activeTab, loadLegend]);

  // Refresh star count optimistically
  const handleNoteStar = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, stars: (n.stars || 0) + 1 } : n));
    loadNotes(); // re-fetch to get updated stars_log
  };
  const handleLegendStar = (resourceId: string) => {
    setLegendItems(prev => prev.map(r => r.id === resourceId ? { ...r, stars: (r.stars || 0) + 1 } : r));
    loadLegend();
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { alert('File must be smaller than 10MB'); return; }
      setSelectedFile(file);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setShowAuth(true); return; }
    if (!title || !subject) return alert('Title and subject required');
    if (!linkUrl && !selectedFile) return alert('Either provide a Drive link or upload a PDF');

    setIsUploading(true);
    let finalUrl = linkUrl;
    try {
      if (selectedFile) finalUrl = await uploadToCloudinary(selectedFile);
      const res = await submitPyq({ title, subject, author, file_url: finalUrl, program: uploadProgram, semester: uploadSemester, category: uploadCategory }, token);
      if (res.success) {
        alert('✅ Submitted! You'll receive an email once the admin reviews your note.');
        setTitle(''); setSubject(''); setAuthor(''); setLinkUrl(''); setSelectedFile(null);
        setActiveTab('feed');
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitLegend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setShowAuth(true); return; }
    setIsLegendUploading(true);
    try {
      const res = await submitLegendResource({
        title: lgTitle, drive_link: lgDriveLink, legend_name: lgLegendName,
        subject: lgSubject, description: lgDescription, program: lgProgram, semester: lgSemester
      }, token);
      if (res.success) {
        alert('🏆 Legend Resource submitted! You'll be emailed once the admin reviews it.');
        setLgTitle(''); setLgDriveLink(''); setLgLegendName(''); setLgSubject('');
        setLgDescription(''); setActiveTab('legend');
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsLegendUploading(false);
    }
  };

  // ── Lock screen if not logged in ─────────────────────────────────────────
  if (!user) return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} reason="to access PYQs & Notes" />}
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="glass-card p-8 max-w-sm w-full space-y-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto border-2 border-yellow-400/30">
            <Lock className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-xl font-black text-white">PYQs & Notes 📚</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Login with your <span className="text-blue-300">@mitwpu.edu.in</span> email to access semester notes, PYQs, and Legend Resources.
          </p>
          <button onClick={() => setShowAuth(true)} className="w-full py-3 rounded-xl font-black text-sm text-black bg-yellow-400 hover:bg-yellow-300 transition-all">
            Login to Access →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-24">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} reason="to access PYQs & Notes" />}

      {/* Banner */}
      <div className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 border"
        style={{ background: 'rgba(255,215,64,0.12)', borderColor: 'rgba(255,215,64,0.3)' }}>
        <div className="float-anim"><DoraemonReading /></div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
            Mithya <span className="text-yellow-400">Notes & PYQs</span> Vault
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Share your best study materials · Discover <span className="font-bold text-amber-300">Legend Resources</span> · Give stars for what helped you 🌟
          </p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 gap-1">
        {[
          { id: 'feed', label: '📚 Notes & PYQs' },
          { id: 'legend', label: '🏆 Legend' },
          { id: 'upload', label: '⬆️ Upload' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.id
                ? tab.id === 'legend'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FEED TAB                                             */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'feed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject or author..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-10 text-white placeholder-white/30 outline-none focus:border-yellow-400 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Program</p>
              <div className="flex gap-2 overflow-x-auto tab-scroll pb-1">
                {(['All', ...PROGRAMS] as const).map(p => (
                  <button key={p} onClick={() => setSelectedProgram(p)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedProgram === p ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40' : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Semester</p>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...SEMESTERS] as const).map(s => (
                  <button key={s} onClick={() => setSelectedSemester(s)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedSemester === s ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'}`}>
                    {s === 'All' ? 'All Sems' : `Sem ${s}`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Category</p>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...CATEGORIES] as const).map(c => (
                  <button key={c} onClick={() => setSelectedCategory(c)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedCategory === c ? 'bg-green-500/20 text-green-300 border-green-400/40' : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <SkeletonPYQItem key={i} />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-white/40" />
              <p className="text-white font-semibold">No notes found for this filter.</p>
              <p className="text-white/40 text-xs mt-1">Try a different program or semester.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {notes.map(note => (
                <NoteCard key={note.id} note={note} token={token} onStar={handleNoteStar} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* LEGEND TAB                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'legend' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Info banner */}
          <div className="rounded-2xl p-4 border flex items-start gap-3"
            style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <Trophy className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-amber-300 mb-0.5">What are Legend Resources?</p>
              <p className="text-xs text-white/60 leading-relaxed">
                Curated Google Drive links from outstanding professors, toppers, and legendary students that the community considers must-have study material. Give ⭐ stars for everything that genuinely helped you — no limit!
              </p>
            </div>
          </div>

          {isLegendLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <SkeletonPYQItem key={i} />)}
            </div>
          ) : legendItems.length === 0 ? (
            <div className="text-center py-16 opacity-50">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-400/40" />
              <p className="text-white font-semibold">No Legend Resources yet.</p>
              <p className="text-white/40 text-xs mt-1">Be the first! Submit one via the Upload tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {legendItems.map(resource => (
                <LegendCard key={resource.id} resource={resource} token={token} onStar={handleLegendStar} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* UPLOAD TAB                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'upload' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Sub-tab toggle */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 gap-1">
            <button
              onClick={() => setUploadSubTab('note')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${uploadSubTab === 'note' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              📄 Upload a Note / PYQ
            </button>
            <button
              onClick={() => setUploadSubTab('legend')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${uploadSubTab === 'legend' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-white/50 hover:text-white/80'}`}
            >
              🏆 Submit Legend Resource
            </button>
          </div>

          {/* ── Note form ── */}
          {uploadSubTab === 'note' && (
            <div className="glass-card p-6 border border-white/10">
              <form onSubmit={handleSubmitNote} className="space-y-4">
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-yellow-400" /> Share your Notes
                </h3>
                <p className="text-xs text-white/40 leading-relaxed -mt-2 mb-3">
                  Admin will review before it goes public. You'll get an email with the decision. ✉️
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-yellow-300 ml-1">Program *</label>
                    <select value={uploadProgram} onChange={e => setUploadProgram(e.target.value as ProgramType)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 cursor-pointer">
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-300 ml-1">Semester *</label>
                    <select value={uploadSemester} onChange={e => setUploadSemester(e.target.value)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-400 cursor-pointer">
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-300 ml-1">Category *</label>
                    <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-400 cursor-pointer">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-white/60 ml-1">Document Title *</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} type="text"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400"
                      placeholder="e.g. EndSem CS 2025 PYQ" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Subject / Course *</label>
                    <input required value={subject} onChange={e => setSubject(e.target.value)} type="text"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400"
                      placeholder="e.g. Data Structures" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Your Name (Optional)</label>
                    <input value={author} onChange={e => setAuthor(e.target.value)} type="text"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400"
                      placeholder="To get your Student Star 🌟" />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <p className="text-sm font-bold text-white/80">Attachment Method:</p>
                  <div>
                    <label className="text-xs font-bold text-blue-300 ml-1 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Method 1: Google Drive Link
                    </label>
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} disabled={!!selectedFile} type="url"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-30 outline-none focus:border-yellow-400"
                      placeholder="Make sure 'Anyone with link can view' is set" />
                  </div>
                  <div className="text-center text-xs font-black text-white/30 uppercase tracking-widest">- OR -</div>
                  <div>
                    <label className="text-xs font-bold text-yellow-400 ml-1 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Method 2: Direct Upload (PDF / Image)
                    </label>
                    <div className="mt-1 relative group cursor-pointer" onClick={() => !linkUrl && fileInputRef.current?.click()}>
                      <div className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors ${linkUrl ? 'border-white/10 opacity-30 select-none' : 'border-white/30 hover:border-yellow-400 bg-white/5'}`}>
                        {selectedFile ? <p className="text-sm font-bold text-white p-2">{selectedFile.name}</p>
                          : <p className="text-sm text-white/50">Click to select PDF or Image</p>}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileSelection} disabled={!!linkUrl} className="hidden" accept=".pdf,image/*" />
                    </div>
                  </div>
                </div>

                <button disabled={isUploading} type="submit"
                  className="w-full py-3.5 mt-2 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : 'Submit for Review ✅'}
                </button>
                <p className="text-center text-[10px] text-white/40">Admin reviews before going public. You'll get a notification email. ✉️</p>
              </form>
            </div>
          )}

          {/* ── Legend Resource form ── */}
          {uploadSubTab === 'legend' && (
            <div className="glass-card p-6 border" style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
              <form onSubmit={handleSubmitLegend} className="space-y-4">
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Submit a Legend Resource
                </h3>
                <p className="text-xs text-white/40 leading-relaxed -mt-2 mb-3">
                  Know of a legendary professor's notes or a topper's Drive folder? Share the link — admin will verify and publish it. ✉️
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-amber-300 ml-1">Resource Title *</label>
                    <input required value={lgTitle} onChange={e => setLgTitle(e.target.value)} type="text"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Prof. Sharma's Complete DBMS Notes" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-amber-300 ml-1 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Google Drive Link *</label>
                    <input required value={lgDriveLink} onChange={e => setLgDriveLink(e.target.value)} type="url"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400"
                      placeholder="https://drive.google.com/..." />
                    <p className="text-[10px] text-white/30 mt-1 ml-1">⚠️ Make sure sharing is set to "Anyone with link can view"</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Legend Person's Name *</label>
                    <input required value={lgLegendName} onChange={e => setLgLegendName(e.target.value)} type="text"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. Prof. A.K. Sharma / Himanshu R." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Subject *</label>
                    <input required value={lgSubject} onChange={e => setLgSubject(e.target.value)} type="text"
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400"
                      placeholder="e.g. DBMS / DSA / OS" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-yellow-300 ml-1">Program</label>
                    <select value={lgProgram} onChange={e => setLgProgram(e.target.value as ProgramType)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400 cursor-pointer">
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-300 ml-1">Semester</label>
                    <select value={lgSemester} onChange={e => setLgSemester(e.target.value)}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400 cursor-pointer">
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-white/60 ml-1">Description (Optional)</label>
                    <textarea value={lgDescription} onChange={e => setLgDescription(e.target.value)} rows={2}
                      className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-400 resize-none"
                      placeholder="What makes this resource legendary? What's covered?" />
                  </div>
                </div>

                <button disabled={isLegendUploading} type="submit"
                  className="w-full py-3.5 mt-2 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  {isLegendUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Submit Legend Resource 🏆</>}
                </button>
                <p className="text-center text-[10px] text-white/40">Admin verifies before publishing. You'll get a notification email. ✉️</p>
              </form>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
