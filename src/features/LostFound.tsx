import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Upload, X, MessageCircle, AlertCircle, Plus, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';
import { getLostFoundItems, createLostFoundItem } from '../services/api';
import type { LostItem } from '../types';

export default function LostFound() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Lost' | 'Found'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [type, setType] = useState<'Lost' | 'Found'>('Lost');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadItems() {
      const res = await getLostFoundItems();
      if (res.success && res.data) {
        setItems(res.data);
      }
      setIsLoadingFeed(false);
    }
    loadItems();
  }, []);

  const formatTimeAgo = (isoString: string) => {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000 / 60; // minutes
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !description || !contactName || !phone) {
      alert("Please fill all text fields!");
      return;
    }

    setIsUploading(true);
    try {
      let cloudinaryUrl = undefined;
      
      // 1. Direct Upload to Cloudinary (Bypassing Python Server)
      if (selectedFile) {
        cloudinaryUrl = await uploadToCloudinary(selectedFile);
      }

      // 2. Add to actual Database via API
      const payload = {
        item_name: itemName,
        description,
        contact_name: contactName,
        phone_number: phone,
        type,
        image_url: cloudinaryUrl
      };

      const res = await createLostFoundItem(payload);
      
      if (!res.success) {
        throw new Error(res.message || "Failed to save to database");
      }

      // Add the new item returned by DB to our UI feed
      setItems([res.data, ...items]);
      
      // Reset & Close
      setIsModalOpen(false);
      setItemName('');
      setDescription('');
      setContactName('');
      setPhone('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const openWhatsApp = (phone: string, itemType: string, itemName: string) => {
    // Basic sanitization
    const cleanPhone = phone.replace(/\\D/g, '');
    const prefix = cleanPhone.length === 10 ? '91' : '';
    
    // Auto-fill message
    const msg = `Hi! I saw your post on Mithya about the ${itemType.toLowerCase()} ${itemName}.`;
    const url = `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filteredItems = items
    .filter(item => filter === 'All' ? true : item.type === filter)
    .filter(item => 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header & Controls */}
      <div className="glass-card p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧳</span>
            <div>
              <h2 className="text-xl font-black text-white">Lost & Found</h2>
              <p className="text-white/60 text-xs mt-0.5">Help reuniting stuff with students.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FFD740, #F9A825)', color: '#1a1a2e' }}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Report Item</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white placeholder-white/40 outline-none focus:border-doraSky transition-colors"
            />
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            {['All', 'Lost', 'Found'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  filter === tab ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoadingFeed ? (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 text-doraSky animate-spin mx-auto mb-3" />
          <p className="text-white/60 font-semibold">Loading items...</p>
        </div>
      ) : (
        <>
          {/* Item Feed Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map(item => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col overflow-hidden border border-white/10"
            style={{ 
              background: item.type === 'Lost' ? 'rgba(229,57,53,0.05)' : 'rgba(76,175,80,0.05)'
            }}
          >
            {/* Image (if any) */}
            {item.image_url ? (
              <div className="w-full h-40 bg-black/20 relative">
                <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                  {formatTimeAgo(item.timestamp)}
                </div>
              </div>
            ) : null}

            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-white font-bold text-lg leading-tight">{item.item_name}</h3>
                {!item.image_url && (
                  <span className="text-[10px] font-bold text-white/40 shrink-0">{formatTimeAgo(item.timestamp)}</span>
                )}
              </div>
              
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider w-max mb-3 ${
                item.type === 'Lost' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {item.type}
              </span>

              <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                {item.description}
              </p>

              {/* Contact Area */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between mt-auto">
                <div className="text-xs text-white/50">
                  Reported by: <span className="text-white/80 font-bold">{item.contact_name}</span>
                </div>
                <button 
                  onClick={() => openWhatsApp(item.phone_number, item.type, item.item_name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-white/60">No items found.</p>
        </div>
      )}
    </>
  )}

  {/* CREATE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto glass-card border border-white/20 flex flex-col rounded-t-[24px] sm:rounded-[24px]"
              style={{ background: '#111827' }}
            >
              <div className="sticky top-0 bg-gray-900/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10 z-10">
                <h3 className="text-lg font-black text-white">Report Item</h3>
                <button 
                  onClick={() => !isUploading && setIsModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Image Upload Area */}
                <div 
                  className="relative rounded-xl border-2 border-dashed border-white/20 bg-white/5 overflow-hidden group hover:border-doraSky transition-colors flex items-center justify-center cursor-pointer"
                  style={{ minHeight: previewUrl ? 'auto' : '120px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-white/30 mx-auto mb-2 group-hover:text-doraSky transition-colors" />
                      <p className="text-sm font-semibold text-white/60">Tap to upload a photo</p>
                      <p className="text-[10px] text-white/40 mt-1">Optional, max 5MB</p>
                    </div>
                  )}
                  <input 
                    type="file" ref={fileInputRef} onChange={handleFileChange}
                    accept="image/*" className="hidden"
                  />
                  {previewUrl && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md">Change Photo</span>
                    </div>
                  )}
                </div>

                {/* Type Selection */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                  <button type="button" onClick={() => setType('Lost')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${type === 'Lost' ? 'bg-red-500/20 text-red-300' : 'text-white/40 hover:text-white/80'}`}
                  >Lost It</button>
                  <button type="button" onClick={() => setType('Found')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${type === 'Found' ? 'bg-green-500/20 text-green-300' : 'text-white/40 hover:text-white/80'}`}
                  >Found It</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Item Headline</label>
                    <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} required placeholder="e.g. Blue Milton Bottle"
                      className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky" />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/60 ml-1">Location & Details</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} placeholder="Where and when did you last see it?"
                      className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">Your Name</label>
                      <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} required placeholder="Name"
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">WhatsApp No.</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="10-digit number"
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-doraSky" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" disabled={isUploading}
                  className="w-full py-3.5 mt-2 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)', color: 'white' }}
                >
                  {isUploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading securely...</>
                  ) : (
                    <><Upload className="w-5 h-5" /> Post to {type}</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
