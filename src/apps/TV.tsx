import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { OrderStatus } from '../types';
import { Monitor, Smartphone, Clock, PackageOpen, LogOut } from 'lucide-react';

export const TV = ({ onExit }: { onExit?: () => void }) => {
  const { orders, currentSession } = useStore();
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');

  // Filter orders by current session
  const sessionOrders = currentSession 
    ? orders.filter(o => o.session_id === currentSession.id)
    : [];

  // Filter logic
  // Preparing: status=PREPARING
  // Sort: Oldest started_at first (Ascending). This naturally puts delayed items at the top/start.
  const preparing = sessionOrders
    .filter(o => o.status === OrderStatus.PREPARING)
    .sort((a, b) => new Date(a.started_at || a.created_at).getTime() - new Date(b.started_at || b.created_at).getTime());
    
  // Ready: status=READY or PARTIAL, sorted by newest first (so recent ready items are at top)
  const ready = sessionOrders
    .filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.PARTIAL)
    .sort((a, b) => new Date(b.ready_at || b.created_at).getTime() - new Date(a.ready_at || a.created_at).getTime());

  // Auto-switch based on window aspect ratio
  useEffect(() => {
      const handleResize = () => {
          if (window.innerHeight > window.innerWidth) setOrientation('PORTRAIT');
          else setOrientation('LANDSCAPE');
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Init
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`h-screen bg-gray-900 text-white flex overflow-hidden relative font-sans ${orientation === 'PORTRAIT' ? 'flex-col' : 'flex-row'}`}>
        
        {/* Demo Controls Overlay */}
        <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full z-50 flex gap-2">
            <button onClick={() => setOrientation('LANDSCAPE')} className={`p-2 rounded-full hover:bg-white/10 ${orientation === 'LANDSCAPE' ? 'text-blue-400' : 'text-gray-400'}`} title="Landscape Mode"><Monitor size={20} /></button>
            <button onClick={() => setOrientation('PORTRAIT')} className={`p-2 rounded-full hover:bg-white/10 ${orientation === 'PORTRAIT' ? 'text-blue-400' : 'text-gray-400'}`} title="Portrait Mode"><Smartphone size={20} /></button>
            {onExit && (
                <button onClick={onExit} className="p-2 rounded-full hover:bg-white/10 text-blue-400" title="Trocar Módulo">
                    <LogOut size={20} className="rotate-180" />
                </button>
            )}
        </div>

        {/* READY SECTION */}
        <StatusSection 
            title="PRONTO" 
            subtitle="Retire seu pedido no balcão"
            orders={ready} 
            theme="green"
            orientation={orientation}
            isPrimary={true}
        />

        {/* PREPARING SECTION */}
        <StatusSection 
            title="PREPARANDO" 
            subtitle="Estamos preparando seu pedido"
            orders={preparing} 
            theme="yellow"
            orientation={orientation}
            isPrimary={false}
        />
    </div>
  );
};

const StatusSection = ({ title, subtitle, orders, theme, orientation, isPrimary }: any) => {
    const isPortrait = orientation === 'PORTRAIT';
    
    // Timer to update "delayed" status visualization in real-time
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 5000); // Check every 5s
        return () => clearInterval(interval);
    }, []);
    
    // Theme Colors
    const colors = {
        green: {
            bg: 'bg-green-900/20',
            header: 'bg-green-700',
            text: 'text-green-400',
            border: 'border-green-500',
            cardBg: 'bg-green-900/40'
        },
        yellow: {
            bg: 'bg-yellow-900/10',
            header: 'bg-gray-800',
            text: 'text-yellow-400',
            border: 'border-yellow-600/50',
            cardBg: 'bg-gray-800/50'
        }
    };
    
    const c = colors[theme as keyof typeof colors];

    return (
        <div className={`
            flex-1 flex flex-col relative overflow-hidden border-gray-800 ${c.bg}
            ${!isPortrait && isPrimary ? 'border-r-2' : ''}
            ${isPortrait && isPrimary ? 'border-b-2' : ''}
        `}>
            {/* Header */}
            <div className={`${c.header} p-6 text-center shadow-lg z-10 flex flex-col justify-center shrink-0 h-32`}>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-white drop-shadow-md">
                    {title}
                </h1>
                <p className="text-white/80 font-medium uppercase tracking-wider text-sm md:text-lg mt-1">
                    {subtitle}
                </p>
            </div>
            
            {/* List View (Row Layout) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative">
                <div className="flex flex-col gap-4">
                    {orders.map((order: any) => {
                        // Calculate if order is delayed (> 3 minutes)
                        // Only applies to PREPARING (isPrimary=false) items
                        const startTime = new Date(order.started_at || order.created_at).getTime();
                        const elapsedMinutes = (now.getTime() - startTime) / 60000;
                        const isDelayed = !isPrimary && elapsedMinutes > 3;

                        // Check Partial
                        const isPartial = order.status === 'PARTIAL';

                        // Dynamic Font Size based on ID Length
                        const idLength = order.order_number.toString().length;
                        const fontSizeClass = idLength > 5 
                            ? 'text-5xl md:text-6xl' 
                            : idLength > 3 
                                ? 'text-6xl md:text-8xl' 
                                : 'text-7xl md:text-8xl';

                        return (
                            <div 
                                key={order.id} 
                                className={`
                                    relative transition-all duration-500 animate-in slide-in-from-right fill-mode-backwards group w-full
                                `}
                            >
                                <div className={`
                                    flex items-center justify-between px-8 py-2 rounded-2xl shadow-xl relative overflow-hidden transition-all duration-500 w-full min-h-[120px]
                                    border-l-8 ${c.cardBg}
                                    ${isDelayed 
                                        ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-pulse bg-red-900/30' // Delayed style
                                        : isPartial
                                            ? 'border-orange-500 border-dashed bg-orange-900/20' // Partial style
                                            : `${c.border}` // Normal style
                                    }
                                `}>
                                    {isPrimary && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}
                                    
                                    {/* Order Number */}
                                    <span className={`font-black font-mono tracking-tighter z-10 leading-none break-all ${
                                        isDelayed 
                                            ? 'text-red-200' 
                                            : `${c.text}`
                                    } ${fontSizeClass}`}>
                                        {order.order_number}
                                    </span>

                                    {/* Customer Name & Status Badges */}
                                    <div className="flex flex-col items-end gap-2 z-10">
                                        {order.customer_name && (
                                            <span className="text-white/60 text-xl md:text-2xl font-bold uppercase truncate max-w-[200px] md:max-w-[400px]">
                                                {order.customer_name}
                                            </span>
                                        )}
                                        
                                        <div className="flex gap-3">
                                             {/* Delayed Indicator */}
                                            {isDelayed && (
                                                <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full animate-bounce shadow-lg">
                                                    <Clock size={24} className="animate-spin-slow" />
                                                    <span className="text-lg font-bold uppercase tracking-widest hidden md:inline">Atrasado</span>
                                                </div>
                                            )}

                                            {/* Partial Indicator */}
                                            {isPartial && (
                                                <div className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg">
                                                    <PackageOpen size={24} />
                                                    <span className="text-lg font-bold uppercase tracking-widest hidden md:inline">Parcial</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {orders.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none select-none">
                        <span className="text-8xl mb-4">{isPrimary ? '✨' : '🍳'}</span>
                        <span className="text-2xl font-bold uppercase tracking-widest">Sem pedidos</span>
                    </div>
                )}
            </div>
        </div>
    );
};