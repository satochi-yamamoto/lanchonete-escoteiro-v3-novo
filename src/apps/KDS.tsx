import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { OrderStatus, Station } from '../types';
import { KdsTicket } from '../components/kds/KdsComponents';
import { Filter, Wifi, WifiOff, Bell, Volume2, VolumeX, LogOut } from 'lucide-react';
import { playSound } from '../components/ui';

export const KDS = ({ onExit }: { onExit?: () => void }) => {
  const { orders, currentSession, updateOrderStatus, toggleOrderItemComplete, recallOrder, setOrderItemPrepTime } = useStore();
  const activeStationState = useState<Station | 'ALL'>('ALL');
  const [activeStation, setActiveStation] = activeStationState;
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter Orders for Display
  // 1. Must be PAID, PREPARING, READY, or PARTIAL (not cancelled/delivered)
  // 2. If station selected, must contain items from that station
  // 3. Must belong to the current store session
  const filteredOrders = orders.filter(o => {
      // If no session is active, do not show any orders (or show only those belonging to the active session)
      if (!currentSession) return false;
      if (o.session_id !== currentSession.id) return false;

      const validStatus = [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.PARTIAL].includes(o.status);
      if (!validStatus) return false;

      if (activeStation === 'ALL') return true;
      return o.items.some(i => i.station === activeStation);
  }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Group by Status
  const received = filteredOrders.filter(o => o.status === OrderStatus.PAID);
  const preparing = filteredOrders.filter(o => o.status === OrderStatus.PREPARING);
  // Include PARTIAL in the Ready column logic, but we might visualize it differently in the ticket component
  const ready = filteredOrders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.PARTIAL);

  // --- Audio & Visual Alert Logic for New Orders ---
  const previousOrderIds = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Detect new orders that are PAID (arriving in kitchen)
    const incomingOrders = orders.filter(o => o.status === OrderStatus.PAID);
    const currentIds = new Set<string>(incomingOrders.map(o => o.id));
    
    // Check if there's any ID in currentIds that was NOT in previousOrderIds
    let isNew = false;
    for (const id of currentIds) {
        if (!previousOrderIds.current.has(id)) {
            isNew = true;
            break;
        }
    }
    
    // Skip alert on first render to avoid noise on page refresh
    if (isFirstRender.current) {
        isFirstRender.current = false;
        previousOrderIds.current = currentIds;
        return;
    }

    // Trigger alert if new orders found
    if (isNew) {
        if (soundEnabled) playSound('new_order');
        setNewOrderAlert(true);
        
        // Remove alert after 5 seconds
        const timer = setTimeout(() => {
            setNewOrderAlert(false);
        }, 5000);
        return () => clearTimeout(timer);
    }
    
    previousOrderIds.current = currentIds;
  }, [orders, soundEnabled]);


  // --- Actions ---
  const handleBump = (orderId: string, currentStatus: OrderStatus) => {
    // Standard Workflow: PAID -> PREPARING -> READY -> DELIVERED
    // Partial Workflow: READY -> PARTIAL -> DELIVERED
    
    if (currentStatus === OrderStatus.PAID) {
      updateOrderStatus(orderId, OrderStatus.PREPARING);
    } else if (currentStatus === OrderStatus.PREPARING) {
      updateOrderStatus(orderId, OrderStatus.READY);
    } else if (currentStatus === OrderStatus.READY) {
       // If coming from READY via main button, go straight to delivered (Full Delivery)
       // Note: Partial logic is triggered via specific button in KdsTicket
      updateOrderStatus(orderId, OrderStatus.DELIVERED); 
    } else if (currentStatus === OrderStatus.PARTIAL) {
      updateOrderStatus(orderId, OrderStatus.DELIVERED);
    }
  };

  // Special handler for setting Partial status specifically
  const handleSetPartial = (orderId: string) => {
      updateOrderStatus(orderId, OrderStatus.PARTIAL);
  };

  const stations: (Station | 'ALL')[] = ['ALL', 'GRILL', 'FRYER', 'ASSEMBLY', 'DRINKS'];

  if (!currentSession) {
    return (
        <div className="h-screen bg-gray-950 text-white flex flex-col items-center justify-center font-sans">
            <div className="text-center p-8 bg-gray-900 rounded-2xl border-2 border-red-900/50 shadow-2xl max-w-md">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <VolumeX size={40} />
                </div>
                <h1 className="text-3xl font-black mb-2 text-white">COZINHA FECHADA</h1>
                <p className="text-gray-400 mb-6">Nenhum expediente de loja está ativo no momento. Abra a loja no painel administrativo para iniciar a operação da cozinha.</p>
                <div className="text-xs font-mono text-gray-600 bg-black/30 p-2 rounded">
                    Status: AGUARDANDO_ABERTURA
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden font-sans relative">
      
      {/* New Order Visual Notification Overlay */}
      {newOrderAlert && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-start justify-center pt-24 animate-in fade-in duration-300">
              {/* Full Screen Pulse Border */}
              <div className="absolute inset-0 border-8 border-blue-500/60 animate-pulse shadow-[inset_0_0_60px_rgba(59,130,246,0.3)]" />
              
              {/* Floating Badge */}
              <div className="bg-blue-600 text-white text-xl font-black px-8 py-3 rounded-full shadow-2xl animate-bounce z-10 flex items-center gap-3 border-2 border-white">
                  <Bell size={24} className="animate-wiggle" /> NOVO PEDIDO RECEBIDO!
              </div>
          </div>
      )}
      
      {/* KDS Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">
                <span className="text-red-500 mr-2">KDS</span> 
                {activeStation === 'ALL' ? 'EXPEDIDOR / GERAL' : activeStation}
            </h1>
            
            {/* Station Filter Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
                {stations.map(s => (
                    <button
                        key={s}
                        onClick={() => setActiveStation(s)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeStation === s 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        {s === 'ALL' ? 'TODOS' : s}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
             {onExit && (
                <button 
                    onClick={onExit}
                    className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
                    title="Trocar Módulo"
                >
                    <LogOut size={16} className="rotate-180" />
                    <span className="hidden md:inline font-sans font-bold">Trocar Módulo</span>
                </button>
             )}

             {/* Sound Toggle */}
             <button 
                onClick={() => {
                    // Trigger sound on enable to warm up context
                    if (!soundEnabled) playSound('new_order');
                    setSoundEnabled(!soundEnabled);
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${soundEnabled ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-red-900/30 text-red-500 hover:bg-red-900/50'}`}
                title={soundEnabled ? "Som Ativado" : "Som Desativado"}
            >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <div className="flex items-center gap-2">
                <Wifi size={16} className="text-green-500" /> ONLINE
            </div>
            <div className="bg-gray-800 px-3 py-1 rounded">
                FILA: {filteredOrders.length}
            </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex h-full gap-4 min-w-full md:min-w-[1200px]">
              
              {/* Column: Received */}
              <KdsColumn title="RECEBIDOS" count={received.length} color="border-t-4 border-gray-500">
                  {received.map(order => (
                      <KdsTicket 
                          key={order.id} 
                          order={order} 
                          activeStation={activeStation}
                          soundEnabled={soundEnabled}
                          onBump={handleBump}
                          onItemToggle={toggleOrderItemComplete}
                          onRecall={recallOrder}
                          onSetPrepTime={setOrderItemPrepTime}
                      />
                  ))}
              </KdsColumn>

              {/* Column: Prep */}
              <KdsColumn title="PREPARANDO" count={preparing.length} color="border-t-4 border-blue-500" bg="bg-blue-900/10">
                  {preparing.map(order => (
                      <KdsTicket 
                          key={order.id} 
                          order={order} 
                          activeStation={activeStation}
                          soundEnabled={soundEnabled}
                          onBump={handleBump}
                          onItemToggle={toggleOrderItemComplete}
                          onRecall={recallOrder}
                          onSetPrepTime={setOrderItemPrepTime}
                      />
                  ))}
              </KdsColumn>

              {/* Column: Ready / Partial */}
              <KdsColumn title="PRONTO / PARCIAL" count={ready.length} color="border-t-4 border-green-500" bg="bg-green-900/10">
                  {ready.map(order => (
                      <KdsTicket 
                          key={order.id} 
                          order={order} 
                          activeStation={activeStation}
                          soundEnabled={soundEnabled}
                          onBump={(id, status) => {
                              // If button clicked is specific for partial, logic handles inside Ticket or we assume bump means full finish
                              if (status === OrderStatus.PARTIAL) {
                                handleSetPartial(id);
                              } else {
                                handleBump(id, status);
                              }
                          }}
                          onItemToggle={toggleOrderItemComplete}
                          onRecall={recallOrder}
                          onSetPrepTime={setOrderItemPrepTime}
                      />
                  ))}
              </KdsColumn>

          </div>
      </div>
    </div>
  );
};

const KdsColumn = ({ title, count, children, color, bg = '' }: any) => (
    <div className={`flex-1 flex flex-col min-w-[350px] max-w-[450px] h-full rounded-xl bg-gray-900/50 ${bg}`}>
        <div className={`p-4 flex justify-between items-center bg-gray-900 ${color} rounded-t-xl`}>
            <h2 className="text-lg font-bold tracking-wider text-gray-200">{title}</h2>
            <span className="bg-gray-800 text-white px-3 py-1 rounded-full font-mono font-bold text-sm">
                {count}
            </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
            {children}
            {count === 0 && (
                <div className="h-32 flex items-center justify-center text-gray-700 italic border-2 border-dashed border-gray-800 rounded-lg">
                    Vazio
                </div>
            )}
        </div>
    </div>
);