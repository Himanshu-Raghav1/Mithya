import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Upload, Loader2, Link as LinkIcon, Download, Search, X, Lock } from 'lucide-react';
import { getPyqs, submitPyq } from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';
import type { ProgramType } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

// Doraemon Reading SVG
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

const PROGRAMS: ProgramType[] = ['BTech', 'BCA', 'BBA', 'BA', 'B.com', 'BSc', 'B.des'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const CATEGORIES = ['PYQs', 'Notes', 'PPT or PDF'];

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

export default function PYQsNotes() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'upload'>('feed');

  // Feed State
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Upload Form State
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

  // Debounce search so we don't hit API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadPublicNotes = useCallback(async () => {
    setIsLoading(true);
    const res = await getPyqs(selectedProgram, selectedSemester, selectedCategory, debouncedSearch);
    if (res.success && res.data) setNotes(res.data);
    else setNotes([]);
    setIsLoading(false);
  }, [selectedProgram, selectedSemester, selectedCategory, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'feed') loadPublicNotes();
  }, [activeTab, loadPublicNotes]);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File must be smaller than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject) return alert('Title and subject required');
    if (!linkUrl && !selectedFile) return alert('Either provide a Drive link or upload a PDF');

    setIsUploading(true);
    let finalUrl = linkUrl;

    try {
      if (selectedFile) {
        finalUrl = await uploadToCloudinary(selectedFile);
      }

      const res = await submitPyq({
        title, subject, author,
        file_url: finalUrl,
        program: uploadProgram,
        semester: uploadSemester,
        category: uploadCategory,
      });

      if (res.success) {
        alert('Success! Your note has been submitted to the Admin for approval.');
        setTitle(''); setSubject(''); setAuthor(''); setLinkUrl(''); setSelectedFile(null);
        setActiveTab('feed');
      } else {
        alert('Error submitting: ' + res.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearSearch = () => setSearchQuery('');

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-24">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} reason="to access PYQs & Notes" />}

      {/* 🔒 Auth Lock Screen */}
      {!user && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="glass-card p-8 max-w-sm w-full space-y-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto border-2 border-yellow-400/30">
              <Lock className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-xl font-black text-white">PYQs & Notes 📚</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Login with your <span className="text-blue-300">@mitwpu.edu.in</span> email to access semester notes, PYQs, and study materials.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-3 rounded-xl font-black text-sm text-black bg-yellow-400 hover:bg-yellow-300 transition-all"
            >
              Login to Access →
            </button>
          </div>
        </div>
      )}

      {/* Main content (only shown when logged in) */}
      {user && <>

      {/* Banner */}
      <div
        className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 border"
        style={{ background: 'rgba(255,215,64,0.12)', borderColor: 'rgba(255,215,64,0.3)' }}
      >
        <div className="float-anim">
          <DoraemonReading />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
            Mithya <span className="text-yellow-400">Notes & PYQs</span> Vault
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Share your best study materials and become a <span className="font-bold text-yellow-300">Student Star</span>.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 relative overflow-hidden">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'feed' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          📚 All PYQs and Notes
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'upload' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          ⬆️ Upload
        </button>
        {/* Animated Active Background */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] flex-1 rounded-xl z-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          animate={{ x: activeTab === 'feed' ? '2px' : 'calc(100% + 2px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      </div>

      {/* --- FEED TAB --- */}
      {activeTab === 'feed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject or author..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-10 text-white placeholder-white/30 outline-none focus:border-yellow-400 transition-colors"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Program Filter */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Program</p>
            <div className="flex gap-2 overflow-x-auto tab-scroll pb-1">
              {(['All', ...PROGRAMS] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedProgram(p)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedProgram === p
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40'
                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Semester Filter */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Semester</p>
            <div className="flex gap-2 flex-wrap">
              {(['All', ...SEMESTERS] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSemester(s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedSemester === s
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'
                  }`}
                >
                  {s === 'All' ? 'All Sems' : `Sem ${s}`}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Category</p>
            <div className="flex gap-2 flex-wrap">
              {(['All', ...CATEGORIES] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCategory === c
                      ? 'bg-green-500/20 text-green-300 border-green-400/40'
                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonPYQItem />
              <SkeletonPYQItem />
              <SkeletonPYQItem />
              <SkeletonPYQItem />
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
                <div
                  key={note.id}
                  className="glass-card p-5 border border-white/10 hover:border-yellow-400/40 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 w-max">
                        {note.subject}
                      </span>
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {note.program && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-500/15 text-yellow-300 border border-yellow-500/25">
                            {note.program}
                          </span>
                        )}
                        {note.semester && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            Sem {note.semester}
                          </span>
                        )}
                        {note.category && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/15 text-green-300 border border-green-500/25">
                            {note.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-white/30 shrink-0">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-4 line-clamp-2">{note.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-white/50">
                      By: <span className="font-bold text-yellow-400">{note.author || 'Anonymous'} 🌟</span>
                    </span>
                    <a
                      href={note.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white/10 hover:bg-yellow-400/20 text-white hover:text-yellow-300 rounded-lg transition-colors"
                      title="Open / Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* --- UPLOAD TAB --- */}
      {activeTab === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-white/10"
        >
          <form onSubmit={handleSubmitNote} className="space-y-4">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-yellow-400" /> Share your Notes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Program */}
              <div>
                <label className="text-xs font-bold text-yellow-300 ml-1">Program *</label>
                <select
                  value={uploadProgram}
                  onChange={e => setUploadProgram(e.target.value as ProgramType)}
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 cursor-pointer"
                >
                  {PROGRAMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="text-xs font-bold text-purple-300 ml-1">Semester *</label>
                <select
                  value={uploadSemester}
                  onChange={e => setUploadSemester(e.target.value)}
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-400 cursor-pointer"
                >
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-green-300 ml-1">Category *</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-400 cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-white/60 ml-1">Document Title *</label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  type="text"
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400"
                  placeholder="e.g. EndSem CS 2025 PYQ"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-white/60 ml-1">Subject / Course *</label>
                <input
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  type="text"
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400"
                  placeholder="e.g. Data Structures"
                />
              </div>

              {/* Author */}
              <div>
                <label className="text-xs font-bold text-white/60 ml-1">Your Name (Optional)</label>
                <input
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  type="text"
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400"
                  placeholder="To get your Student Star 🌟"
                />
              </div>
            </div>

            {/* Attachment Method */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <p className="text-sm font-bold text-white/80">Attachment Method:</p>

              {/* Drive Link */}
              <div>
                <label className="text-xs font-bold text-blue-300 ml-1 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Method 1: Google Drive Link
                </label>
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  disabled={!!selectedFile}
                  type="url"
                  className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-30 outline-none focus:border-yellow-400"
                  placeholder="Make sure the link is 'Anyone with link can view'"
                />
              </div>

              <div className="text-center text-xs font-black text-white/30 uppercase tracking-widest">- OR -</div>

              {/* Direct Upload */}
              <div>
                <label className="text-xs font-bold text-yellow-400 ml-1 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Method 2: Direct Upload (PDF / Image)
                </label>
                <div
                  className="mt-1 relative group cursor-pointer"
                  onClick={() => !linkUrl && fileInputRef.current?.click()}
                >
                  <div
                    className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                      linkUrl
                        ? 'border-white/10 opacity-30 select-none'
                        : 'border-white/30 hover:border-yellow-400 bg-white/5'
                    }`}
                  >
                    {selectedFile ? (
                      <p className="text-sm font-bold text-white p-2">{selectedFile.name}</p>
                    ) : (
                      <p className="text-sm text-white/50">Click to select PDF or Image</p>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelection}
                    disabled={!!linkUrl}
                    className="hidden"
                    accept=".pdf,image/*"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={isUploading}
              type="submit"
              className="w-full py-3.5 mt-6 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading securely...</> : 'Submit for Verification ✅'}
            </button>
            <p className="text-center text-[10px] text-white/40 mt-2">
              All uploads are subject to Admin review before appearing on the feed.
            </p>
          </form>
        </motion.div>
      )}
      </>}
    </div>
  );
}
