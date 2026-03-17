import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogOut, CheckCircle2, XCircle, Trash2, Plus, Loader2, Link as LinkIcon, GlobeLock, Book, MessageSquare, Phone } from 'lucide-react';
import { 
  verifyAdmin, getPendingPyqs, moderatePyq, 
  getForumPosts, deleteVoicePost, deleteVoiceComment,
  getContacts, createContact, deleteContact
} from '../services/api';

import type { ContactCategory, ForumPost, Contact } from '../types';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'pyqs' | 'voice' | 'contacts'>('pyqs');

  // PYQs State
  const [pendingNotes, setPendingNotes] = useState<any[]>([]);
  const [loadingPyqs, setLoadingPyqs] = useState(false);

  // MITVoice State
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // New Contact Form State
  const [cName, setCName] = useState('');
  const [cRole, setCRole] = useState('');
  const [cDept, setCDept] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCategory, setCCategory] = useState<ContactCategory>('Dean');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const res = await verifyAdmin(username, password);
    if (res.success) {
      setIsAuthenticated(true);
      loadPyqs(); // Load initial data
    } else {
      alert(`Invalid credentials: ${res.message || "User ID is required."}`);
    }
    setAuthLoading(false);
  };

  // --- Loaders ---
  const loadPyqs = async () => {
    setLoadingPyqs(true);
    const res = await getPendingPyqs();
    if (res.success && res.data) setPendingNotes(res.data);
    setLoadingPyqs(false);
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

  // Load data when tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'pyqs') loadPyqs();
    if (activeTab === 'voice') loadVoice();
    if (activeTab === 'contacts') loadContacts();
  }, [activeTab, isAuthenticated]);

  // --- Actions ---
  const handleModeratePyq = async (id: string, action: 'approve' | 'reject') => {
    const res = await moderatePyq(id, action);
    if (res.success) {
      setPendingNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post instantly?")) return;
    const res = await deleteVoicePost(id);
    if (res.success) {
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const res = await deleteVoiceComment(postId, commentId);
    if (res.success) {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: p.comments.filter(c => c.id !== commentId) };
        }
        return p;
      }));
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cCategory) return;
    
    // Optimistic UI for form reset
    const payload: Partial<Contact> = { name: cName, role: cRole, department: cDept, email: cEmail, phone: cPhone, category: cCategory };
    const res = await createContact(payload);
    if (res.success && res.data) {
      setContacts([...contacts, res.data]);
      setCName(''); setCRole(''); setCDept(''); setCEmail(''); setCPhone('');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this contact from the public directory?")) return;
    const res = await deleteContact(id);
    if (res.success) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- RENDER UN-AUTHED ---
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

  // --- RENDER AUTHED ---
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
        <button onClick={() => setActiveTab('voice')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'voice' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <MessageSquare className="w-4 h-4" /> MITVoice Moderation
        </button>
        <button onClick={() => setActiveTab('contacts')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 ${activeTab === 'contacts' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}>
          <Phone className="w-4 h-4" /> Contacts Directory
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
                  <p className="text-xs text-white/50 mb-2">By: {note.author}</p>
                  <a href={note.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-yellow-400 text-sm hover:underline"><LinkIcon className="w-3.5 h-3.5"/> Inspect File / Link</a>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleModeratePyq(note.id, 'approve')} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Approve</button>
                  <button onClick={() => handleModeratePyq(note.id, 'reject')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Reject/Delete</button>
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
             
             {/* Add New Form */}
             <div className="glass-card p-5 border border-green-500/30 bg-green-900/10">
               <h3 className="font-black text-white mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-green-400"/> Add New Contact Directory Entry</h3>
               <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <input required value={cName} onChange={e=>setCName(e.target.value)} type="text" placeholder="Name (e.g. Dr. Patil)" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cRole} onChange={e=>setCRole(e.target.value)} type="text" placeholder="Role (e.g. Associate Dean)" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cDept} onChange={e=>setCDept(e.target.value)} type="text" placeholder="Department (e.g. SOC)" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cPhone} onChange={e=>setCPhone(e.target.value)} type="tel" placeholder="Phone Number" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <input value={cEmail} onChange={e=>setCEmail(e.target.value)} type="email" placeholder="Email Address" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
                 <div className="flex gap-2">
                   <select value={cCategory} onChange={e=>setCCategory(e.target.value as ContactCategory)} className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-400">
                     <option value="Dean">Dean</option>
                     <option value="Faculty">Faculty</option>
                     <option value="Admin">Admin</option>
                     <option value="Emergency">Emergency</option>
                   </select>
                   <button type="submit" className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors">ADD</button>
                 </div>
               </form>
             </div>

             {/* Live Directory List */}
             <div className="space-y-2">
               {loadingContacts ? <p className="text-white/50 text-center py-4">Fetching directory...</p> : contacts.map(contact => (
                 <div key={contact.id} className="flex flex-col sm:flex-row justify-between items-center bg-black/40 border border-white/10 p-3 rounded-xl gap-4">
                   <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block sm:w-20 text-center ${contact.category==='Emergency'?'bg-red-500/20 text-red-400':contact.category==='Dean'?'bg-yellow-500/20 text-yellow-500':'bg-blue-500/20 text-blue-300'}`}>{contact.category}</span>
                     <div>
                       <p className="text-white font-bold text-sm leading-none">{contact.name}</p>
                       <p className="text-white/50 text-[10px] mt-1">{contact.role} {contact.department ? `· ${contact.department}` : ''}</p>
                     </div>
                     <div className="text-xs text-white/70 space-y-0.5">
                       {contact.phone && <p>📞 {contact.phone}</p>}
                       {contact.email && <p>✉️ {contact.email}</p>}
                     </div>
                   </div>
                   <button onClick={() => handleDeleteContact(contact.id!)} className="w-full sm:w-auto p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
             </div>
           </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
