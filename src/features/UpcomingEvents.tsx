import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Plus, Loader2, Upload, Calendar, X, Image as ImageIcon } from 'lucide-react';
import type { EventItem, EventTag } from '../types';
import { getEvents, createEvent } from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';

// Shinchan mini SVG
function ShinchanMini() {
  return (
    <svg viewBox="0 0 60 70" className="w-14 h-14 flex-shrink-0">
      {/* Hair spikes */}
      <polygon points="20,14 26,4 32,14" fill="#2d1b05" />
      <polygon points="28,12 34,2 40,12" fill="#2d1b05" />
      {/* Head */}
      <circle cx="30" cy="28" r="20" fill="#FDBCB4" />
      {/* Eyes */}
      <ellipse cx="22" cy="24" rx="5" ry="5.5" fill="#1a1a2e" />
      <ellipse cx="38" cy="24" rx="5" ry="5.5" fill="#1a1a2e" />
      <ellipse cx="22" cy="24" rx="3" ry="3.5" fill="white" />
      <ellipse cx="38" cy="24" rx="3" ry="3.5" fill="white" />
      <circle cx="23" cy="23" r="1.5" fill="#1a1a2e" />
      <circle cx="39" cy="23" r="1.5" fill="#1a1a2e" />
      {/* Eyebrows */}
      <path d="M 17 18 Q 22 15 27 18" stroke="#2d1b05" strokeWidth="2" fill="none" />
      <path d="M 33 18 Q 38 15 43 18" stroke="#2d1b05" strokeWidth="2" fill="none" />
      {/* Nose */}
      <ellipse cx="30" cy="31" rx="3" ry="2" fill="#d4956a" />
      {/* Mouth - big wide */}
      <path d="M 20 37 Q 30 45 40 37" stroke="#c0392b" strokeWidth="2" fill="#E57373" strokeLinecap="round" />
      {/* Body */}
      <rect x="12" y="48" width="36" height="22" rx="8" fill="#E53935" />
      {/* Ears */}
      <ellipse cx="10" cy="28" rx="4" ry="5" fill="#FDBCB4" />
      <ellipse cx="50" cy="28" rx="4" ry="5" fill="#FDBCB4" />
    </svg>
  );
}

const TAG_COLORS: Record<EventTag, { bg: string; text: string; border: string }> = {
  Hackathon:   { bg: 'rgba(0,168,232,0.2)',  text: '#4FC3F7', border: 'rgba(0,168,232,0.4)' },
  Ideathon:    { bg: 'rgba(156,39,176,0.2)', text: '#CE93D8', border: 'rgba(156,39,176,0.4)' },
  'Club Drive':{ bg: 'rgba(255,152,0,0.2)',  text: '#FFCC02', border: 'rgba(255,152,0,0.4)' },
  Volunteering:{ bg: 'rgba(76,175,80,0.2)',  text: '#81C784', border: 'rgba(76,175,80,0.4)' },
  Workshop:    { bg: 'rgba(233,30,99,0.2)',  text: '#F48FB1', border: 'rgba(233,30,99,0.4)' },
  Competition: { bg: 'rgba(229,57,53,0.2)',  text: '#EF9A9A', border: 'rgba(229,57,53,0.4)' },
  Recruitment: { bg: 'rgba(0,150,136,0.2)',  text: '#80CBC4', border: 'rgba(0,150,136,0.4)' },
  Concert:     { bg: 'rgba(255,193,7,0.2)',  text: '#FFE082', border: 'rgba(255,193,7,0.4)' },
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [tag, setTag] = useState<EventTag>('Concert');
  const [url, setUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadEvents() {
      const res = await getEvents();
      if (res.success && res.data) {
        setEvents(res.data);
      }
      setIsLoading(false);
    }
    loadEvents();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Poster must be smaller than 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      alert("Title and Date are required!");
      return;
    }

    setIsUploading(true);
    let uploadedUrl = undefined;

    try {
      if (selectedImage) {
        uploadedUrl = await uploadToCloudinary(selectedImage);
      }

      const payload = {
        title,
        date,
        description,
        organizer: organizer || "MIT-WPU",
        tag,
        url,
        image_url: uploadedUrl,
        icon: tag === 'Concert' ? '🎤' : '📅'
      };

      const res = await createEvent(payload);
      if (res.success && res.data) {
        setEvents([...events, res.data]);
        setIsModalOpen(false);
        // reset form
        setTitle(''); setDate(''); setDescription(''); setUrl(''); setOrganizer('');
        setSelectedImage(null); setPreviewUrl(null);
      } else {
        alert("Failed to create: " + res.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Shinchan banner */}
      <div className="glass-card p-4 flex items-center justify-between" style={{ background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.25)' }}>
        <div className="flex items-center gap-4">
          <div className="wobble-anim">
            <ShinchanMini />
          </div>
          <div className="flex-1">
            <p className="text-red-300 font-black text-sm mb-1">📣 SHINCHAN SAYS:</p>
            <p className="text-white/90 text-xs sm:text-[13px] font-semibold leading-relaxed">
              "All college events, concert posters, and club recruitments will be shared right here. Don't miss them! 😤"
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 ml-2 sm:ml-4 px-3 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 bg-white/10 hover:bg-white/20 border border-white/20"
        >
          <Plus className="w-4 h-4 mx-auto mb-1" />
          Add
        </button>
      </div>

      {/* Events map list */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 text-red-400 animate-spin mx-auto mb-3" />
          <p className="text-white/60 font-semibold">Hunting for events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 opacity-50">
          <Calendar className="w-12 h-12 mx-auto mb-3" />
          <p className="text-white">No upcoming events right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event, i) => {
            const tag = Object.keys(TAG_COLORS).includes(event.tag) 
              ? TAG_COLORS[event.tag as EventTag] 
              : TAG_COLORS['Workshop'];

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden flex flex-col sm:flex-row"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {/* Poster Image (Left side on desktop, top on mobile) */}
                {event.image_url ? (
                  <div className="w-full sm:w-48 h-48 sm:h-auto bg-black/40 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-white/10">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full sm:w-24 h-24 sm:h-auto bg-white/5 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-white/10">
                     <span className="text-4xl opacity-50">{event.icon}</span>
                  </div>
                )}

                {/* Event Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                       <h3 className="text-white font-black text-lg leading-snug">
                        {event.title}
                      </h3>
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0"
                        style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}
                      >
                        {event.tag}
                      </span>
                    </div>
                    
                    <p className="text-red-300 text-sm font-bold flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </p>
                    
                    {event.description && (
                      <p className="text-white/70 text-sm leading-relaxed mb-4">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Footer / Links */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                    <span className="text-white/40 text-xs text-left">
                      By: <span className="text-white/70 font-bold">{event.organizer}</span>
                    </span>
                    
                    {event.url && (
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        Tickets/Link <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ADMIN UPLOAD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-card border border-white/20"
              style={{ background: '#111827', borderRadius: '24px' }}
            >
              <div className="sticky top-0 bg-gray-900/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10 z-10">
                <h3 className="text-lg font-black text-white">Publish Event</h3>
                <button onClick={() => !isUploading && setIsModalOpen(false)} className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-4 space-y-4">
                {/* Poster Upload */}
                <div>
                  <label className="text-xs font-bold text-white/60 ml-1 block mb-1">Event Poster (Optional)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-xl border-2 border-dashed border-white/20 bg-white/5 overflow-hidden group hover:border-doraSky transition-colors flex items-center justify-center cursor-pointer min-h-[120px]"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-white/30 mx-auto mb-2 group-hover:text-doraSky" />
                        <p className="text-xs font-semibold text-white/50 group-hover:text-white/80">Click to upload poster</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Max 5MB</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    
                    {previewUrl && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md">Change Poster</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-white/60 ml-1">Event Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky transition-colors" placeholder="e.g. CodeFest 2026" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Date String</label>
                    <input type="text" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky transition-colors" placeholder="15th April, 10 AM" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Category / Tag</label>
                    <select value={tag} onChange={e => setTag(e.target.value as EventTag)} className="w-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-[11px] text-white outline-none focus:border-doraSky cursor-pointer">
                      {Object.keys(TAG_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Organizer (Club/Dept)</label>
                    <input type="text" value={organizer} onChange={e => setOrganizer(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky transition-colors" placeholder="e.g. ACM Chapter" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Registration Link</label>
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky transition-colors" placeholder="https://..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-white/60 ml-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky transition-colors resize-none" placeholder="Short description about the event..." />
                  </div>
                </div>

                <button 
                  type="submit" disabled={isUploading}
                  className="w-full py-3.5 mt-2 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)', color: 'white' }}
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5" /> Publish to MIT</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
