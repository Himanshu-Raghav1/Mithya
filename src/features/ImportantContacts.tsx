import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Copy, Check } from 'lucide-react';
import type { Contact, ContactCategory } from '../types';

const CONTACTS: Contact[] = [];

const CATEGORY_STYLE: Record<ContactCategory, { bg: string; text: string; border: string; emoji: string }> = {
  Dean:      { bg: 'rgba(255,215,64,0.15)',  text: '#FFD740', border: 'rgba(255,215,64,0.3)',  emoji: '👑' },
  Faculty:   { bg: 'rgba(0,168,232,0.15)',   text: '#4FC3F7', border: 'rgba(0,168,232,0.3)',   emoji: '🎓' },
  Emergency: { bg: 'rgba(229,57,53,0.15)',   text: '#EF9A9A', border: 'rgba(229,57,53,0.3)',   emoji: '🚨' },
  Admin:     { bg: 'rgba(76,175,80,0.15)',   text: '#81C784', border: 'rgba(76,175,80,0.3)',   emoji: '🏢' },
};

const CATEGORIES: ContactCategory[] = ['Emergency', 'Dean', 'Faculty', 'Admin'];

function ContactCard({ contact }: { contact: Contact }) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const style = CATEGORY_STYLE[contact.category];

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

  const filtered = activeFilter === 'All'
    ? CONTACTS
    : CONTACTS.filter(c => c.category === activeFilter);

  return (
    <div className="p-4 space-y-4">
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
            {cat === 'All' ? '🌐 All' : `${CATEGORY_STYLE[cat].emoji} ${cat}`}
          </motion.button>
        ))}
      </div>

      {/* Contact grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </div>
    </div>
  );
}
