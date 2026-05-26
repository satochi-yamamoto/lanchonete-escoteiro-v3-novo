import React from 'react';

// Singleton AudioContext to prevent limit errors and allow easy resumption
let audioCtx: AudioContext | null = null;

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-cooper-leaf text-white hover:bg-cooper-leafDark shadow-lift",
    secondary: "bg-cooper-surface text-cooper-ink border border-cooper-line hover:bg-cooper-panel",
    success: "bg-cooper-moss text-white hover:bg-cooper-leaf shadow-lift",
    danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
    warning: "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-cooper-surface rounded-lg border border-cooper-line shadow-soft p-4 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PREPARING: "bg-amber-50 text-amber-800 border border-amber-200",
    READY: "bg-green-50 text-green-800 border border-green-200",
    PARTIAL: "bg-orange-50 text-orange-800 border border-orange-200",
    DELIVERED: "bg-cooper-ink text-white",
    CANCELLED: "bg-red-100 text-red-600",
  };

  const labels: Record<string, string> = {
    PENDING: "PENDENTE",
    PAID: "PAGO",
    PREPARING: "PREPARANDO",
    READY: "PRONTO",
    PARTIAL: "PARCIAL",
    DELIVERED: "ENTREGUE",
    CANCELLED: "CANCELADO"
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold ${colors[status] || "bg-gray-100"}`}>
      {labels[status] || status}
    </span>
  );
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export const playSound = (type: 'new_order' | 'warning') => {
  if (typeof window === 'undefined') return;

  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();
  }
  
  // Try to resume if suspended (common in browsers until user interaction)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  const ctx = audioCtx;
  
  if (type === 'new_order') {
    // "Ding" - High pleasant chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } else {
    // "Buzz" - Warning low sawtooth
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
};
