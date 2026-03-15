import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { EventItem, EventTag } from '../types';

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

const EVENTS: EventItem[] = [
  {
    id: "amaal-mallik-pune",
    title: "Amaal Mallik Live in Pune",
    date: "TBA - BookMyShow",
    tag: "Concert",
    description: "Catch the musical sensation Amaal Mallik performing live! Join the huge crowd from MIT.",
    organizer: "External (Pune)",
    icon: "🎤",
    url: "https://in.bookmyshow.com/events/araam-malik-live-in-pune/ET00486866"
  }
];

export default function UpcomingEvents() {
  return (
    <div className="p-4 space-y-4">
      {/* Shinchan banner */}
      <div className="glass-card p-4 flex items-center gap-4" style={{ background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.25)' }}>
        <div className="wobble-anim">
          <ShinchanMini />
        </div>
        <div>
          <p className="text-red-300 font-black text-sm mb-1">📣 SHINCHAN SAYS:</p>
          <p className="text-white/90 text-sm font-semibold leading-relaxed">
            "Listen up! All college events, club competitions, volunteering opportunities, and club recruitments will be shared right here. Don't you dare miss them! 😤"
          </p>
        </div>
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EVENTS.map((event, i) => {
          const tag = TAG_COLORS[event.tag];
          const CardContent = (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`glass-card p-4 space-y-3 h-full flex flex-col ${event.url ? 'cursor-pointer hover:shadow-lg hover:shadow-white/5' : 'cursor-default'}`}
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-3xl">{event.icon}</span>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
                  style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}
                >
                  {event.tag}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-base leading-snug flex items-center gap-2">
                  {event.title}
                  {event.url && <ExternalLink className="w-4 h-4 text-white/50" />}
                </h3>
                <p className="text-blue-200 text-xs font-bold mt-1">📅 {event.date}</p>
                <p className="text-white/60 text-xs leading-relaxed mt-2">{event.description}</p>
              </div>
              <div className="flex items-center gap-1 pt-3 mt-auto border-t border-white/10">
                <span className="text-white/40 text-xs">By: <span className="text-white/60 font-semibold">{event.organizer}</span></span>
              </div>
            </motion.div>
          );

          if (event.url) {
            return (
              <a key={event.id} href={event.url} target="_blank" rel="noreferrer" className="block outline-none">
                {CardContent}
              </a>
            );
          }
          return CardContent;
        })}
      </div>
    </div>
  );
}
