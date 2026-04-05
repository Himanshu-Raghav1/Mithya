import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { getPinboard } from '../services/api';
import type { PinItem } from '../types';

const SkeletonPin = () => (
  <div className="glass-card overflow-hidden animate-pulse mb-4 break-inside-avoid" style={{ background: 'rgba(255,255,255,0.04)' }}>
    <div className="w-full h-48 bg-white/10" />
    <div className="p-3">
      <div className="w-3/4 h-4 bg-white/10 rounded mb-2" />
      <div className="w-1/2 h-3 bg-white/10 rounded" />
    </div>
  </div>
);

export default function PinBoard() {
  const [pins, setPins] = useState<PinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPins() {
      const res = await getPinboard();
      if (res.success && res.data) {
        setPins(res.data);
      }
      setIsLoading(false);
    }
    loadPins();
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="glass-card p-5 border border-white/10 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FF6B6B, #E53935)' }}>
          <Pin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Campus PIN Board</h2>
          <p className="text-white/60 text-sm mt-0.5">A visual journey through campus life. Curated by Mithya Admins.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          <SkeletonPin />
          <SkeletonPin />
          <SkeletonPin />
          <SkeletonPin />
        </div>
      ) : pins.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <Pin className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p className="text-white font-semibold">The pin board is currently empty.</p>
          <p className="text-white/40 text-xs mt-1">Check back later for new photos!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {pins.map((pin) => (
            <motion.div
              key={pin.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="break-inside-avoid glass-card overflow-hidden group cursor-pointer border border-white/10 hover:border-white/30 transition-colors"
              onClick={() => setExpandedImage(pin.image_url)}
              whileHover={{ y: -4 }}
            >
              <img
                src={pin.image_url}
                alt="Pin"
                className="w-full h-auto object-cover border-b border-white/10"
                loading="lazy"
              />
              <div className="p-3 bg-black/40">
                {pin.caption && (
                  <p className="text-white/90 text-sm font-medium leading-snug mb-2">
                    {pin.caption}
                  </p>
                )}
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  {formatTime(pin.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[80]"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              src={expandedImage}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
