import React from 'react';

// Singleton AudioContext to prevent limit errors and allow easy resumption
let audioCtx: AudioContext | null = null;

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-4 py-3 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200",
    secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
    warning: "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200"
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
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    PAID: "bg-blue-100 text-blue-600",
    PREPARING: "bg-yellow-100 text-yellow-700",
    READY: "bg-green-100 text-green-700",
    PARTIAL: "bg-orange-100 text-orange-700 border border-orange-200",
    DELIVERED: "bg-gray-800 text-white",
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