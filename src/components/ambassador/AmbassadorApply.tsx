import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

/* ── tiny inline SVG icons ── */
const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const TelegramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
  </svg>
);

const AmbassadorApply: React.FC = () => {
  const [xHandle, setXHandle] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xHandle || !telegramHandle) {
      setError('Please fill in both fields.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const { error: submitError } = await supabase
        .from('ambassador_applications')
        .insert([{ x_handle: xHandle, telegram_handle: telegramHandle }]);
      if (submitError) throw submitError;
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Shared input wrapper style factory ── */
  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    background: '#111827', borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.06)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    padding: '18px 18px 18px 0',
    fontSize: 16, color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700,
    color: '#9ca3af', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: 10, paddingLeft: 2,
  };

  const iconBoxStyle: React.CSSProperties = {
    padding: '16px 14px 16px 18px', color: '#6b7280',
    display: 'flex', alignItems: 'center',
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = '#ff6b35';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.15)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
    e.currentTarget.style.boxShadow = 'none';
  };

  /* ── The form content (shared between mobile & desktop) ── */
  const formContent = (
    <>
      <form onSubmit={handleSubmit}>
        {/* X (Twitter) Handle */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>X (Twitter) Handle</label>
          <div style={inputWrapperStyle} onFocus={handleFocus} onBlur={handleBlur}>
            <div style={iconBoxStyle}><XIcon /></div>
            <input type="text" value={xHandle} onChange={(e) => setXHandle(e.target.value)}
              placeholder="@username" style={inputStyle} />
          </div>
        </div>

        {/* Telegram Handle */}
        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>Telegram Handle</label>
          <div style={inputWrapperStyle} onFocus={handleFocus} onBlur={handleBlur}>
            <div style={iconBoxStyle}><TelegramIcon /></div>
            <input type="text" value={telegramHandle} onChange={(e) => setTelegramHandle(e.target.value)}
              placeholder="@username" style={inputStyle} />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                padding: '14px 18px', marginBottom: 24,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12, fontSize: 14,
                color: '#f87171', textAlign: 'center', fontWeight: 500,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit" disabled={isSubmitting}
          style={{
            width: '100%', padding: '18px 24px',
            background: 'linear-gradient(135deg, #ff6b35, #f54e15)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            boxShadow: '0 4px 24px rgba(255,107,53,0.35)',
            transition: 'transform 0.15s, box-shadow 0.2s',
            opacity: isSubmitting ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(255,107,53,0.5)'; }}}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,107,53,0.35)'; }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
          {!isSubmitting && <Send size={18} />}
        </button>
      </form>

      {/* Footer */}
      <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
          By applying, you agree to become a core part of the ClawdOS community and ecosystem.
        </p>
      </div>
    </>
  );

  /* ────────────────── SUCCESS SCREEN ────────────────── */
  if (isSuccess) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050a14', fontFamily: "'Inter', system-ui, sans-serif",
        userSelect: 'text', overflow: 'auto', padding: isMobile ? 20 : 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/ambassador.jpeg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15, filter: 'blur(4px)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'relative', zIndex: 1,
            maxWidth: 460, width: '100%',
            background: 'rgba(14,22,38,0.85)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: isMobile ? '36px 24px' : '48px 36px',
            textAlign: 'center',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 0 30px rgba(34,197,94,0.25)',
            }}
          >
            <CheckCircle size={40} color="#4ade80" />
          </motion.div>
          <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Application Received
          </h2>
          <p style={{ fontSize: 15, color: '#9ca3af', lineHeight: 1.7, marginBottom: 32 }}>
            Thank you for applying to the ClawdOS Ambassador Program.
            We will review your application and contact you soon.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              width: '100%', padding: '16px 24px',
              background: '#ff6b35', color: '#fff',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e55a28')}
            onMouseLeave={e => (e.currentTarget.style.background = '#ff6b35')}
          >
            Return to ClawdOS <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  /* ────────────────── MOBILE LAYOUT ────────────────── */
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        background: '#050a14', fontFamily: "'Inter', system-ui, sans-serif",
        userSelect: 'text', overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Hero image area */}
        <div style={{
          position: 'relative', width: '100%', height: 280, flexShrink: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/ambassador.jpeg)',
            backgroundSize: 'cover', backgroundPosition: 'center top',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 30%, #050a14 100%)',
            pointerEvents: 'none',
          }} />
          {/* Mobile branding text on image */}
          <div style={{
            position: 'absolute', bottom: 24, left: 0, right: 0,
            textAlign: 'center', zIndex: 2,
          }}>
            <h1 style={{
              fontSize: 28, fontWeight: 900, color: '#fff',
              lineHeight: 1.15, letterSpacing: '-0.01em',
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            }}>
              Ambassador Program
            </h1>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6,
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}>
              Join the ClawdOS movement today
            </p>
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: '28px 24px 40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {formContent}
          </motion.div>
        </div>
      </div>
    );
  }

  /* ────────────────── DESKTOP LAYOUT ────────────────── */
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'row',
      background: '#050a14', fontFamily: "'Inter', system-ui, sans-serif",
      userSelect: 'text', overflow: 'hidden',
    }}>

      {/* ── LEFT: Background Image ── */}
      <div style={{
        position: 'relative', flex: '1 1 55%',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/ambassador.jpeg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 40%, #050a14 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ position: 'relative', zIndex: 2, padding: '0 56px 56px' }}
        >
          <h1 style={{
            fontSize: 52, fontWeight: 900, color: '#fff',
            lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}>
            Shape the Future<br />of Web3 OS
          </h1>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.75)',
            maxWidth: 420, lineHeight: 1.6,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            Join the ClawdOS Ambassador Program and become a leading voice in the next generation of decentralized ecosystems.
          </p>
        </motion.div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div style={{
        flex: '0 0 45%', maxWidth: 560,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        overflowY: 'auto',
        background: '#050a14',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <h2 style={{
            fontSize: 36, fontWeight: 800, color: '#fff',
            marginBottom: 8, letterSpacing: '-0.01em',
          }}>
            Apply Now
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 40, lineHeight: 1.6 }}>
            Submit your social handles below to join the ambassador ranks.
          </p>
          {formContent}
        </motion.div>
      </div>
    </div>
  );
};

export default AmbassadorApply;
