import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Copy, Check, Loader2 } from 'lucide-react';
import type { Contact, ContactCategory } from '../types';
import { getContacts } from '../services/api';

const CATEGORY_STYLE: Record<ContactCategory, { bg: string; text: string; border: string; emoji: string }> = {
  Dean:          { bg: 'rgba(255,215,64,0.15)',  text: '#FFD740', border: 'rgba(255,215,64,0.3)',  emoji: '👑' },
  Faculty:       { bg: 'rgba(0,168,232,0.15)',   text: '#4FC3F7', border: 'rgba(0,168,232,0.3)',   emoji: '🎓' },
  Emergency:     { bg: 'rgba(229,57,53,0.15)',   text: '#EF9A9A', border: 'rgba(229,57,53,0.3)',   emoji: '🚨' },
  Admin:         { bg: 'rgba(76,175,80,0.15)',   text: '#81C784', border: 'rgba(76,175,80,0.3)',   emoji: '🏢' },
  'Anti-Ragging':{ bg: 'rgba(244,67,54,0.15)',  text: '#FF7043', border: 'rgba(244,67,54,0.3)',  emoji: '🛡️' },
  ICC:           { bg: 'rgba(156,39,176,0.15)',  text: '#CE93D8', border: 'rgba(156,39,176,0.3)',  emoji: '⚖️' },
  Grievance:     { bg: 'rgba(255,152,0,0.15)',   text: '#FFB74D', border: 'rgba(255,152,0,0.3)',   emoji: '📋' },
  'SC-ST':       { bg: 'rgba(0,150,136,0.15)',   text: '#4DB6AC', border: 'rgba(0,150,136,0.3)',   emoji: '🤝' },
  Board:         { bg: 'rgba(63,81,181,0.15)',   text: '#7986CB', border: 'rgba(63,81,181,0.3)',   emoji: '🏛️' },
};

const CATEGORIES: ContactCategory[] = ['Emergency', 'Dean', 'Faculty', 'Admin', 'Anti-Ragging', 'ICC', 'Grievance', 'SC-ST', 'Board'];

function ContactCard({ contact }: { contact: Contact }) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const style = CATEGORY_STYLE[contact.category] || CATEGORY_STYLE['Faculty'];

  const copyToClipboard = async (text: string, type: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* silently fail */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card p-4 space-y-2"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-black text-sm">{contact.name}</h3>
          <p className="text-white/60 text-xs">{contact.role}</p>
          <p className="text-white/40 text-xs">{contact.department}</p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
          style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
        >
          {style.emoji} {contact.category}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        {contact.email && (
          <button
            onClick={() => copyToClipboard(contact.email!, 'email')}
            className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 transition-colors w-full text-left group cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate font-medium">{contact.email}</span>
            {copied === 'email' ? <Check className="w-3 h-3 text-green-400 ml-auto" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />}
          </button>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-xs text-green-300 hover:text-green-200 transition-colors group"
          >
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{contact.phone}</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function ImportantContacts() {
  const [activeFilter, setActiveFilter] = useState<ContactCategory | 'All'>('All');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getContacts();
      if (res.success && res.data) {
        setContacts(res.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filtered = activeFilter === 'All'
    ? contacts
    : contacts.filter(c => c.category === activeFilter);

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="glass-card p-4" style={{ background: 'rgba(0,168,232,0.12)' }}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">📞</span>
          <div>
            <h2 className="text-xl font-black text-white">Important Contacts</h2>
            <p className="text-blue-200 text-sm">Deans, Faculty, Admin & Emergency contacts</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto tab-scroll pb-1">
        {(['All', ...CATEGORIES] as const).map(cat => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{
              background: activeFilter === cat ? 'rgba(0,168,232,0.35)' : 'rgba(255,255,255,0.08)',
              color: activeFilter === cat ? '#4FC3F7' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${activeFilter === cat ? 'rgba(0,168,232,0.5)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {cat === 'All' ? '🌐 All' : (CATEGORY_STYLE[cat as ContactCategory] ? `${CATEGORY_STYLE[cat as ContactCategory].emoji} ${cat}` : cat)}
          </motion.button>
        ))}
      </div>

      {/* Contact grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-white/50 py-12 font-bold">No contacts directory published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(contact => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
