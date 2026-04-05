import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Link as LinkIcon, MessageSquare, AlertCircle } from 'lucide-react';

export default function QRGenerator() {
  const [mode, setMode] = useState<'link' | 'message'>('link');
  const [inputValue, setInputValue] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Logic to inject our watermark securely
  const getProcessedValue = () => {
    if (!inputValue.trim()) return '';

    if (mode === 'link') {
      try {
        const url = new URL(inputValue);
        if (url.search) {
          url.searchParams.set('made_by', 'team_mithya');
        } else {
          url.search = '?made_by=team_mithya';
        }
        return url.toString();
      } catch (e) {
        // If it's not a perfectly valid format yet (e.g., user is typing) or they left out 'http://'
        // we'll attempt a soft append for when they scan it.
        const safeVal = inputValue.trim();
        if (safeVal.includes('?')) return safeVal + '&made_by=team_mithya';
        return safeVal + '?made_by=team_mithya';
      }
    } else {
      // Secret Message Mode
      return `${inputValue.trim()}\n\n- Encrypted by team_mithya`;
    }
  };

  const finalQRValue = getProcessedValue();

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Convert directly to high-quality JPG
    const url = canvas.toDataURL('image/jpeg', 1.0);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Mithya_QR_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header & Disclaimer */}
      <div className="glass-card p-5 border border-purple-500/30 flex items-center gap-4" style={{ background: 'rgba(147, 51, 234, 0.1)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #A855F7, #7E22CE)' }}>
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Mithya QR MAKER</h2>
          <p className="text-white/80 text-sm mt-0.5 leading-snug">
            Mithya will make QR for your Website, Portfolio, Any Link or Secret Message for <span className="font-bold text-yellow-400">FREE</span>.
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => { setMode('link'); setInputValue(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'link' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
        >
          <LinkIcon className="w-4 h-4" /> Convert Link
        </button>
        <button
          onClick={() => { setMode('message'); setInputValue(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'message' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
        >
          <MessageSquare className="w-4 h-4" /> Convert
        </button>
      </div>

      {/* Input Area */}
      <div className="glass-card p-5 border border-white/10">
        {mode === 'link' ? (
          <div>
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Paste your URL</label>
            <input
              type="text"
              placeholder="https://example.com/my-website"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Enter Secret Message</label>
            <textarea
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={4}
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>
        )}
        
        {/* Cooking Process Indicator */}
        {inputValue.trim().length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
            <span className="text-yellow-400 text-xs font-bold italic animate-pulse">Enjoy the cooking process 👨‍🍳</span>
          </motion.div>
        )}
      </div>

      {/* Real-time Generator Display */}
      {inputValue.trim() && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 flex flex-col items-center border border-white/20 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {/* Subtle Background Icon */}
          <QrCode className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 opacity-50 pointer-events-none" />

          <div className="bg-white p-2 rounded-2xl shadow-2xl z-10 flex items-center justify-center pointer-events-none">
            <QRCodeCanvas
              value={finalQRValue}
              size={1024}
              style={{ width: 220, height: 220 }}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
              ref={canvasRef}
            />
          </div>

          <div className="mt-6 text-center z-10 w-full">
            <div className="flex items-start gap-2 bg-purple-900/40 border border-purple-500/30 p-3 rounded-lg mb-4 text-left">
              <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white/90 text-xs font-bold mb-1">What happens when scanned?</p>
                <p className="text-purple-200/70 text-[10px] break-all">{finalQRValue}</p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="bg-white text-black font-black px-8 py-3 rounded-xl hover:bg-gray-200 transition-transform active:scale-95 flex items-center gap-2 mx-auto"
            >
              <Download className="w-5 h-5" /> Download QR
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
