import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, LogOut, CheckCircle2, XCircle, Trash2, Plus, 
  Loader2, Link as LinkIcon, GlobeLock, Book, MessageSquare, 
  Phone, Calendar, MapPin, Upload, Search, Trophy
} from 'lucide-react';
import { 
  verifyAdmin, getPendingPyqs, moderatePyq, 
  getForumPosts, deleteVoicePost, deleteVoiceComment,
  getContacts, createContact, deleteContact,
  getEvents, deleteEvent, getPinboard, createPin, deletePin,
  getLostFoundItems, getLostFoundStats, adminResolveLostFoundItem,
  getPendingLegend, moderateLegend
} from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';
import type { ContactCategory, ForumPost, Contact, EventItem, PinItem } from '../types';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'pyqs' | 'legend' | 'voice' | 'contacts' | 'events' | 'pinboard' | 'lostfound'>('pyqs');

  // Legend Resources
  const [pendingLegend, setPendingLegend] = useState<any[]>([]);
  const [loadingLegend, setLoadingLegend] = useState(false);

  // Lost & Found
  const [lfItems, setLfItems] = useState<any[]>([]);
  const [loadingLf, setLoadingLf] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);

  // PYQs
  const [pendingNotes, setPendingNotes] = useState<any[]>([]);
  const [loadingPyqs, setLoadingPyqs] = useState(false);

  // MITVoice
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [cName, setCName] = useState('');
  const [cRole, setCRole] = useState('');
  const [cDept, setCDept] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCategory, setCCategory] = useState<ContactCategory>('Dean');

  // Events
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Pin Board
  const [pins, setPins] = useState<PinItem[]>([]);
  const [loadingPins, setLoadingPins] = useState(false);
  const [pinImage, setPinImage] = useState<File | null>(null);
  const [pinCaption, setPinCaption] = useState('');
  const [isUploadingPin, setIsUploadingPin] = useState(false);
  const pinFileInputRef = useRef<HTMLInputElement>(null);
  const [pinError, setPinError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const res = await verifyAdmin(username, password);
    if (res.success && res.token) {
      sessionStorage.setItem('admin_token', res.token);
      setIsAuthenticated(true);
      loadPyqs();
    } else {
      alert(`Invalid credentials: ${res.message || "User ID is required."}`);
    }
    setAuthLoading(false);
  };

  const loadPyqs = async () => {
    setLoadingPyqs(true);
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await getPendingPyqs(token);
    if (res.success && res.data) setPendingNotes(res.data);
    setLoadingPyqs(false);
  };

  const loadLegend = async () => {
    setLoadingLegend(true);
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await getPendingLegend(token);
    if (res.success && res.data) setPendingLegend(res.data);
    setLoadingLegend(false);
  };

  const loadVoice = async () => {
    setLoadingVoice(true);
    const res = await getForumPosts();
    if (res.success && res.data) setPosts(res.data);
    setLoadingVoice(false);
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    const res = await getContacts();
    if (res.success && res.data) setContacts(res.data);
    setLoadingContacts(false);
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    const res = await getEvents();
    if (res.success && res.data) setEvents(res.data);
    setLoadingEvents(false);
  };

  const loadPins = async () => {
    setLoadingPins(true);
    const res = await getPinboard();
    if (res.success && res.data) setPins(res.data);
    setLoadingPins(false);
  };

  const loadLostFound = async () => {
    setLoadingLf(true);
    const [res, statsRes] = await Promise.all([
      getLostFoundItems(),
      getLostFoundStats()
    ]);
    if (res.success && res.data) setLfItems(res.data);
    if (statsRes.success && statsRes.data) setSolvedCount(statsRes.data.solved_cases);
    setLoadingLf(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'pyqs') loadPyqs();
    if (activeTab === 'legend') loadLegend();
    if (activeTab === 'voice') loadVoice();
    if (activeTab === 'contacts') loadContacts();
    if (activeTab === 'events') loadEvents();
    if (activeTab === 'pinboard') loadPins();
    if (activeTab === 'lostfound') loadLostFound();
  }, [activeTab, isAuthenticated]);

  const handleModerateLegend = async (id: string, action: 'approve' | 'reject') => {
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await moderateLegend(id, action, token);
    if (res.success) {
      setPendingLegend(prev => prev.filter(r => r.id !== id));
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleModeratePyq = async (id: string, action: 'approve' | 'reject') => {
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await moderatePyq(id, action, token);
    if (res.success) {
      setPendingNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post instantly?")) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await deleteVoicePost(id, token);
    if (res.success) setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await deleteVoiceComment(postId, commentId, token);
    if (res.success) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p));
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cCategory) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const payload: Partial<Contact> = { name: cName, role: cRole, department: cDept, email: cEmail, phone: cPhone, category: cCategory };
    const res = await createContact(payload, token);
    if (res.success && res.data) {
      setContacts([...contacts, res.data]);
      setCName(''); setCRole(''); setCDept(''); setCEmail(''); setCPhone('');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this contact from the public directory?")) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await deleteContact(id, token);
    if (res.success) setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteAdminEvent = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this event?")) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await deleteEvent(id, token);
    if (res.success) {
      setEvents(prev => prev.filter(e => e.id !== id));
    } else {
      alert("Failed to delete event: " + res.message);
    }
  };

  const handleUploadPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinImage) return setPinError('Please select an image first.');
    setPinError('');
    setIsUploadingPin(true);
    try {
      // Step 1: upload image to Cloudinary
      let cloudinaryUrl = '';
      try {
        cloudinaryUrl = await uploadToCloudinary(pinImage);
      } catch (cloudErr: any) {
        setPinError('Cloudinary upload failed: ' + cloudErr.message);
        setIsUploadingPin(false);
        return;
      }

      // Step 2: save pin to MongoDB via API
      const token = sessionStorage.getItem('admin_token') || '';
      const res = await createPin(cloudinaryUrl, pinCaption, token);
      console.log('[PinBoard] API response:', res); // debug

      if (res.success && res.data) {
         setPins([res.data, ...pins]);
         setPinImage(null);
         setPinCaption('');
         setPinError('');
         if (pinFileInputRef.current) pinFileInputRef.current.value = '';
      } else {
         setPinError('API error: ' + (res.message || 'Unknown error'));
      }
    } catch (err: any) {
      setPinError('Unexpected error: ' + err.message);
    } finally {
      setIsUploadingPin(false);
    }
  };

  const handleDeletePin = async (id: string) => {
    if (!confirm("Remove this photo from Pin Board?")) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await deletePin(id, token);
    if (res.success) setPins(prev => prev.filter(p => p.id !== id));
  };

  const handleAdminResolveLf = async (id: string) => {
    if (!confirm("Resolve exactly this case and increase the solved count?")) return;
    const token = sessionStorage.getItem('admin_token') || '';
    const res = await adminResolveLostFoundItem(id, token);
    if (res.success) {
      setLfItems(prev => prev.filter(i => i.id !== id));
      setSolvedCount(prev => prev + 1);
    } else {
      alert("Error: " + res.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="glass-card p-8 border border-blue-400/30 max-w-sm w-full text-center relative overflow-hidden">
          <GlobeLock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Security Gateway</h2>
          <p className="text-white/60 text-sm mb-6">Restricted administrative access only.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input required value={username} onChange={e=>setUsername(e.target.value)} type="text" placeholder="User ID" className="w-full bg-black/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400" />
            </div>
            <div>
              <input required value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-black/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400 tracking-widest" />
            </div>
            <button disabled={authLoading} type="submit" className="w-full py-3.5 rounded-xl font-black bg-blue-500 text-white hover:bg-blue-400 transition-colors flex items-center justify-center gap-2">
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Execute Override</>}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between border border-blue-500/30" style={{ background: 'rgba(0,168,232,0.1)' }}>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-xl font-black text-white leading-tight">Mithya Command Center</h2>
            <p className="text-blue-200 text-sm font-bold">Welcome back, {username}</p>
          </div>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors" title="Log Out">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto tab-scroll">
        <button onClick={() => setActiveTab('pyqs')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'pyqs' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <Book className="w-4 h-4" /> PYQs Approvals
          {pendingNotes.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingNotes.length}</span>}
        </button>
        <button onClick={() => setActiveTab('legend')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'legend' ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <Trophy className="w-4 h-4" /> Legend Resources
          {pendingLegend.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingLegend.length}</span>}
        </button>
        <button onClick={() => setActiveTab('voice')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'voice' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <MessageSquare className="w-4 h-4" /> MITVoice Moderation
        </button>
        <button onClick={() => setActiveTab('contacts')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'contacts' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <Phone className="w-4 h-4" /> Directory
        </button>
        <button onClick={() => setActiveTab('events')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'events' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <Calendar className="w-4 h-4" /> Events
        </button>
        <button onClick={() => setActiveTab('pinboard')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'pinboard' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <MapPin className="w-4 h-4" /> Pin Board
        </button>
        <button onClick={() => setActiveTab('lostfound')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'lostfound' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <Search className="w-4 h-4" /> Lost/Found 
          {solvedCount >= 0 && <span className="bg-green-500/20 text-green-300 border border-green-500/30 font-black text-[10px] px-1.5 py-0.5 rounded-full">{solvedCount} Resolved</span>}
        </button>
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        
        {/* PANEL: PYQs */}
        {activeTab === 'pyqs' && (
          <motion.div key="pyqs" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-3">
            {loadingPyqs ? <p className="text-white/50 text-center py-8">Loading queue...</p> : pendingNotes.length === 0 ? (
              <div className="glass-card p-12 text-center border border-white/10"><CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" /><p className="text-white/60 font-bold">Inbox Zero! All submitted notes are reviewed.</p></div>
            ) : pendingNotes.map(note => (
              <div key={note.id} className="glass-card p-4 border border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-black text-blue-300 uppercase">{note.subject}</span>
                  <h4 className="text-white font-bold leading-tight my-1">{note.title}</h4>
                  <p className="text-xs text-white/50 mb-1">By: {note.author} · {note.program} Sem {note.semester} · {note.category}</p>
                  <p className="text-xs text-white/30 mb-2">Submitter: {note.submitter_email}</p>
                  <a href={note.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-yellow-400 text-sm hover:underline"><LinkIcon className="w-3.5 h-3.5"/> Inspect File / Link</a>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleModeratePyq(note.id, 'approve')} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Approve</button>
                  <button onClick={() => handleModeratePyq(note.id, 'reject')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Reject</button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* PANEL: LEGEND RESOURCES */}
        {activeTab === 'legend' && (
          <motion.div key="legend" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-3">
            {loadingLegend ? <p className="text-white/50 text-center py-8">Loading legend submissions...</p> : pendingLegend.length === 0 ? (
              <div className="glass-card p-12 text-center border border-amber-500/20" style={{background:'rgba(245,158,11,0.05)'}}>
                <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-white/60 font-bold">No pending Legend Resources. All clear!</p>
              </div>
            ) : pendingLegend.map(resource => (
              <div key={resource.id} className="glass-card p-4 border flex flex-col sm:flex-row gap-4 items-start justify-between" style={{borderColor:'rgba(245,158,11,0.3)', background:'rgba(245,158,11,0.06)'}}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Legend Resource</span>
                  </div>
                  <h4 className="text-white font-black text-base leading-tight mb-1">{resource.title}</h4>
                  <p className="text-xs text-white/50 mb-1">Legend: <span className="text-amber-300 font-bold">{resource.legend_name}</span> · {resource.subject} · {resource.program} Sem {resource.semester}</p>
                  {resource.description && <p className="text-xs text-white/40 mb-2 italic">{resource.description}</p>}
                  <p className="text-xs text-white/30 mb-2">Submitted by: {resource.submitter_email}</p>
                  <a href={resource.drive_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-400 text-sm hover:underline"><LinkIcon className="w-3.5 h-3.5"/> Inspect Drive Link</a>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleModerateLegend(resource.id, 'approve')} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Approve</button>
                  <button onClick={() => handleModerateLegend(resource.id, 'reject')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Reject</button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* PANEL: VOICE MODERATION */}
        {activeTab === 'voice' && (
           <motion.div key="voice" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-4">
             {loadingVoice ? <p className="text-white/50 text-center py-8">Fetching timeline...</p> : posts.map(post => (
               <div key={post.id} className="glass-card p-4 border border-red-500/20 relative">
                 {post.reported && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-bl-xl rounded-tr-xl">Reported Flag</div>}
                 
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-300 border border-blue-500/30">{post.author.slice(0,2).toUpperCase()}</div>
                      <div>
                        <span className="font-bold text-sm text-white">{post.author}</span>
                        <span className="block text-[10px] text-white/40">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                   </div>
                   <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /> Post</button>
                 </div>
                 
                 <p className="text-white/80 text-sm mt-3 mb-4 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                 {post.image_url && <img src={post.image_url} alt="Attached" className="max-h-48 rounded-xl object-contain mb-4 border border-white/10" />}
                 
                 {post.comments.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                     <p className="text-xs font-bold text-white/40 uppercase mb-2">Comments ({post.comments.length})</p>
                     {post.comments.map(c => (
                       <div key={c.id} className="flex justify-between items-start bg-black/30 p-3 rounded-xl border border-white/5">
                         <div>
                           <span className="text-xs font-bold text-blue-300">{c.author}</span>
                           <p className="text-sm text-white/80 mt-0.5">{c.text}</p>
                         </div>
                         <button onClick={() => handleDeleteComment(post.id, c.id)} className="text-red-400/50 hover:text-red-400 p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             ))}
           </motion.div>
        )}

        {/* PANEL: CONTACTS */}
        {activeTab === 'contacts' && (
           <motion.div key="contacts" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-6">
             <div className="glass-card p-5 border border-green-500/30 bg-green-900/10">
               <h3 className="font-black text-white mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-green-400"/> Add New Contact</h3>
               <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <input required value={cName} onChange={e=>setCName(e.target.value)} type="text" placeholder="Name" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cRole} onChange={e=>setCRole(e.target.value)} type="text" placeholder="Role" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cDept} onChange={e=>setCDept(e.target.value)} type="text" placeholder="Department" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cPhone} onChange={e=>setCPhone(e.target.value)} type="tel" placeholder="Phone" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cEmail} onChange={e=>setCEmail(e.target.value)} type="email" placeholder="Email" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <div className="flex gap-2">
                   <select value={cCategory} onChange={e=>setCCategory(e.target.value as ContactCategory)} className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400">
                     <option value="Dean">Dean</option><option value="Faculty">Faculty</option><option value="Admin">Admin</option><option value="Emergency">Emergency</option>
                   </select>
                   <button type="submit" className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors">ADD</button>
                 </div>
               </form>
             </div>
             <div className="space-y-2">
               {loadingContacts ? <p className="text-white/50 text-center py-4">Fetching directory...</p> : contacts.map(contact => (
                 <div key={contact.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/40 border border-white/10 p-3 rounded-xl gap-4">
                   <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block sm:w-20 text-center ${contact.category==='Emergency'?'bg-red-500/20 text-red-400':contact.category==='Dean'?'bg-yellow-500/20 text-yellow-500':'bg-blue-500/20 text-blue-300'}`}>{contact.category}</span>
                     <div>
                       <p className="text-white font-bold text-sm leading-none">{contact.name}</p>
                       <p className="text-white/50 text-[10px] mt-1">{contact.role} {contact.department ? `· ${contact.department}` : ''}</p>
                     </div>
                   </div>
                   <button onClick={() => handleDeleteContact(contact.id!)} className="w-full sm:w-auto p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
             </div>
           </motion.div>
        )}

        {/* PANEL: EVENTS */}
        {activeTab === 'events' && (
           <motion.div key="events" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-4">
             {loadingEvents ? <p className="text-white/50 text-center py-8">Fetching events...</p> : events.length === 0 ? (
               <div className="glass-card p-12 text-center border border-white/10"><p className="text-white/60 font-bold">No upcoming events.</p></div>
             ) : events.map(event => (
               <div key={event.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/40 border border-white/10 p-4 rounded-xl gap-4">
                 <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
                   <span className="text-4xl">{event.icon}</span>
                   <div>
                     <p className="text-white font-bold text-base leading-none">{event.title}</p>
                     <p className="text-white/50 text-xs mt-1">{event.date} · {event.tag}</p>
                   </div>
                 </div>
                 <button onClick={() => handleDeleteAdminEvent(event.id!)} className="w-full sm:w-auto p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
               </div>
             ))}
           </motion.div>
        )}

        {/* PANEL: PIN BOARD */}
        {activeTab === 'pinboard' && (
           <motion.div key="pinboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-6">
             <div className="glass-card p-5 border border-yellow-500/30 bg-yellow-900/10">
               <h3 className="font-black text-white mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-yellow-400"/> Upload to Pin Board</h3>
               <form onSubmit={handleUploadPin} className="space-y-3">
                 <div className="flex items-center gap-4">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={(e) => { setPinImage(e.target.files?.[0] || null); setPinError(''); }}
                     ref={pinFileInputRef}
                     className="text-sm text-white/70"
                   />
                 </div>
                 <input value={pinCaption} onChange={e=>setPinCaption(e.target.value)} type="text" placeholder="Caption (optional)" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400" />
                 {pinError && (
                   <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-mono">
                     ❌ {pinError}
                   </div>
                 )}
                 <button type="submit" disabled={isUploadingPin} className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {isUploadingPin ? <><Loader2 className="w-4 h-4 animate-spin"/> Uploading...</> : <><MapPin className="w-4 h-4"/> Pin to Board</>}
                 </button>
               </form>
             </div>
             
             {loadingPins ? <p className="text-white/50 text-center py-8">Fetching pins...</p> : (
               <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                 {pins.map(pin => (
                   <div key={pin.id} className="break-inside-avoid relative group rounded-xl overflow-hidden border border-white/10">
                     <img src={pin.image_url} alt="Pin" className="w-full h-auto" />
                     {pin.caption && <div className="absolute bottom-0 w-full bg-black/70 p-2 text-xs text-white pb-3">{pin.caption}</div>}
                     <button onClick={() => handleDeletePin(pin.id!)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
               </div>
             )}
           </motion.div>
        )}

        {/* PANEL: LOST & FOUND */}
        {activeTab === 'lostfound' && (
           <motion.div key="lostfound" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-4">
             {loadingLf ? <p className="text-white/50 text-center py-8">Fetching cases...</p> : lfItems.length === 0 ? (
               <div className="glass-card p-12 text-center border border-white/10"><p className="text-white/60 font-bold">No registered Lost & Found items right now.</p></div>
             ) : lfItems.map(item => (
               <div key={item.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/40 border border-white/10 p-4 rounded-xl gap-4" style={{borderLeft: item.type === 'Lost' ? '4px solid #f87171' : '4px solid #4ade80'}}>
                 {item.image_url && <img src={item.image_url} alt="Item" className="w-20 h-20 object-cover rounded-lg border border-white/10" />}
                 <div className="flex-1 w-full text-center sm:text-left">
                   <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.type === 'Lost' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>{item.type}</span>
                     <p className="text-white font-bold text-lg leading-none">{item.item_name}</p>
                   </div>
                   <p className="text-white/70 text-sm mt-2 line-clamp-3 leading-relaxed">{item.description}</p>
                   <p className="text-white/50 text-[11px] mt-2 font-bold">Posted By: <span className="text-white/80">{item.contact_name}</span> ({item.phone_number})</p>
                 </div>
                 <button onClick={() => handleAdminResolveLf(item.id)} className="w-full sm:w-auto px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 border-b-2 rounded-xl hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg"><CheckCircle2 className="w-5 h-5" /> Mark Solved</button>
               </div>
             ))}
           </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
