import React, { useEffect, useState } from 'react';
import { Order, CartItem, OrderStatus, Station } from '../../types';
import { Button, playSound } from '../ui';
import { Clock, CheckSquare, Square, AlertCircle, Eye, X, Sparkles, Filter, AlertTriangle, Siren, RotateCcw, PackageOpen, Printer, Timer, Plus, Minus, Undo2 } from 'lucide-react';

// --- SLA Timer ---
const OrderTimer = ({ elapsed, slaMinutes = 5 }: { elapsed: number, slaMinutes?: number }) => {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const isLate = elapsed > slaMinutes * 60;
    const isWarning = elapsed > (slaMinutes * 60) * 0.7;

    let colorClass = "text-gray-400";
    if (isLate) colorClass = "text-red-100 font-black animate-pulse bg-red-600 px-2 rounded";
    else if (isWarning) colorClass = "text-yellow-500 font-bold";

    return (
        <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
            <Clock size={14} />
            {formatTime(elapsed)}
            {slaMinutes > 5 && <span className="text-[10px] opacity-70 ml-1">(Est: {slaMinutes}m)</span>}
        </div>
    );
};

// --- KDS Ticket ---
interface KdsTicketProps {
    order: Order;
    activeStation: Station | 'ALL';
    soundEnabled: boolean;
    onBump: (id: string, currentStatus: OrderStatus) => void;
    onItemToggle: (orderId: string, cartId: string) => void;
    onRecall: (id: string) => void;
    onSetPrepTime?: (orderId: string, cartId: string, minutes: number) => void;
}

export const KdsTicket: React.FC<KdsTicketProps> = ({ order, activeStation, soundEnabled, onBump, onItemToggle, onRecall, onSetPrepTime }) => {
    const isReady = order.status === OrderStatus.READY;
    const isPartial = order.status === OrderStatus.PARTIAL;
    
    // Calculate Dynamic SLA based on items
    const maxItemPrep = Math.max(...order.items.map(i => i.estimatedPrepTime || 0));
    const slaMinutes = Math.max(5, maxItemPrep); // Default 5 mins, or highest custom prep time

    // Timer Logic for SLA tracking
    const [elapsed, setElapsed] = useState(0);
    const [alertPlayed, setAlertPlayed] = useState(false);
    
    // Expanded View State
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Celebration State
    const [isCelebrating, setIsCelebrating] = useState(false);

    useEffect(() => {
        const updateElapsed = () => {
            const startTime = order.started_at || order.created_at;
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);
        return () => clearInterval(interval);
    }, [order.started_at, order.created_at]);

    // Check SLA status
    const isLate = !isReady && !isPartial && elapsed > slaMinutes * 60;
    const isApproachingSLA = !isReady && !isPartial && !isLate && elapsed > (slaMinutes * 60) * 0.7; // 70% threshold

    // Play Warning Sound
    useEffect(() => {
        if (isApproachingSLA && !alertPlayed) {
            if (soundEnabled) {
                playSound('warning');
            }
            setAlertPlayed(true);
        }
    }, [isApproachingSLA, alertPlayed, soundEnabled]);

    // Check if entire order is finished (all items checked)
    const allItemsDone = order.items.every(i => i.completed);

    // Handle setting prep time
    const handleSetPrepTime = (e: React.MouseEvent, item: CartItem) => {
        e.stopPropagation();
        if (!onSetPrepTime) return;
        const input = prompt(`Tempo estimado (minutos) para ${item.name}:`, item.estimatedPrepTime?.toString() || "");
        if (input !== null) {
            const mins = parseInt(input);
            if (!isNaN(mins) && mins >= 0) {
                onSetPrepTime(order.id, item.cartId, mins);
            }
        }
    };

    // Handle Bump with Animation
    const handleBumpWithAnimation = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Animate when moving to READY (current is PREPARING) or DELIVERED (current is READY/PARTIAL)
        const shouldAnimate = [OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.PARTIAL].includes(order.status);

        if (shouldAnimate) {
            setIsCelebrating(true);
            setTimeout(() => {
                onBump(order.id, order.status);
                setIsCelebrating(false);
            }, 700);
        } else {
            onBump(order.id, order.status);
        }
    };

    // Print Handler (Full Ticket)
    const handlePrintTicket = (e: React.MouseEvent) => {
        e.stopPropagation();
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const itemsFormatted = order.items.map(i => {
            const status = i.completed ? '[x]' : '[ ]';
            const mods = i.selectedModifiers.length > 0 ? `\n      + ${i.selectedModifiers.join(', ')}` : '';
            const note = i.note ? `\n      ! OBS: ${i.note}` : '';
            return `${status} ${i.name}${mods}${note}`;
        }).join('\n');

        const ticketContent = 
`🖨️ IMPRESSÃO DE TICKET (COZINHA)
--------------------------------
PEDIDO: #${order.order_number}   (${order.type})
HORA:   ${timestamp}
TERM:   ${order.terminal_id || 'N/A'}
CLIENTE: ${order.customer_name || 'N/A'}
--------------------------------
${itemsFormatted}
--------------------------------`;
        
        console.log(ticketContent);
        alert(ticketContent);
    };

    // Print Handler (Single Item)
    const handlePrintItem = (e: React.MouseEvent, item: CartItem) => {
        e.stopPropagation();
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        // Formatted modifiers with indentation
        const mods = item.selectedModifiers.length > 0 ? `\n      + ${item.selectedModifiers.join('\n      + ')}` : '';
        const note = item.note ? `\n      ! OBS: ${item.note}` : '';
        
        const ticketContent = 
`🖨️ IMPRESSÃO DE ITEM INDIVIDUAL
--------------------------------
PEDIDO: #${order.order_number}
ITEM:   ${item.name}
HORA:   ${timestamp}
ESTAÇÃO: ${item.station}
--------------------------------
[ ] ${item.name}${mods}${note}
--------------------------------`;
        
        console.log(ticketContent);
        alert(ticketContent);
    };

    // Dynamic styles based on state
    let containerClass = 'bg-gray-800 border-gray-700';
    let headerClass = 'bg-gray-700';
    
    if (isReady) {
        containerClass = 'bg-green-900 border-green-600 opacity-80 scale-[0.98] border';
        headerClass = 'bg-green-800';
    } else if (isPartial) {
        // ESTILO DISTINTO PARA ENTREGA PARCIAL
        // Fundo alaranjado escuro, borda laranja pulsante, destaque visual claro
        containerClass = 'bg-orange-950/80 border-orange-500 border-2 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-[0.99]';
        headerClass = 'bg-gradient-to-r from-orange-800 to-orange-900 text-white border-b border-orange-700';
    } else if (isLate) {
        // Late: Aggressive Highlight
        containerClass = 'bg-gray-800 ring-4 ring-red-600 ring-offset-2 ring-offset-gray-900 shadow-[0_0_30px_rgba(220,38,38,0.4)] scale-[1.02] z-10 my-2';
        headerClass = 'bg-red-700 animate-pulse';
    } else if (isApproachingSLA) {
        // Warning: Yellow Border
        containerClass = 'bg-gray-800 border-yellow-500 border-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
        headerClass = 'bg-gray-700 border-b border-yellow-500/30';
    } else if (allItemsDone) {
         containerClass = 'bg-gray-800 border-green-500 border-2 shadow-green-900/30';
    } else {
        containerClass = 'bg-gray-800 border border-gray-700 hover:border-gray-600';
    }

    // Filter items for card view
    const visibleItems = order.items.filter(i => activeStation === 'ALL' || i.station === activeStation);
    const hiddenCount = order.items.length - visibleItems.length;

    return (
        <>
             {/* Modal Overlay for Expanded View */}
             {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Click outside to close */}
                    <div className="absolute inset-0" onClick={() => setIsExpanded(false)}></div> 
                    
                    <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-800 rounded-t-xl">
                            <div>
                                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                    #{order.order_number}
                                    <span className={`text-base font-normal px-2 py-1 rounded text-white ${order.type === 'DELIVERY' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                        {order.type}
                                    </span>
                                </h2>
                                <p className="text-gray-400 mt-1 text-lg">{order.customer_name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePrintTicket} className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors" title="Imprimir">
                                    <Printer size={24} />
                                </button>
                                {/* Close Button */}
                                <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - All Items (Full details) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-200">Detalhes do Pedido Completo</h3>
                                <OrderTimer elapsed={elapsed} slaMinutes={slaMinutes} />
                            </div>
                            
                            {order.items.map((item) => {
                                // Visual Filter Logic
                                const isRelevantToStation = activeStation === 'ALL' || item.station === activeStation;
                                
                                return (
                                    <div 
                                        key={item.cartId}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onItemToggle(order.id, item.cartId);
                                        }} 
                                        className={`flex justify-between items-start p-4 rounded-lg border transition-all relative overflow-hidden cursor-pointer select-none ${
                                            item.completed 
                                            ? 'bg-gray-800/50 border-gray-700' // Subtle dimmed background
                                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                        } ${
                                            !isRelevantToStation ? 'opacity-30 grayscale' : ''
                                        }`}
                                    >
                                        <div className="flex gap-4 w-full relative z-10">
                                            <div className={`mt-1 transition-colors ${item.completed ? 'text-green-500' : 'text-gray-500'}`}>
                                                {item.completed ? (
                                                    <CheckSquare size={28} className="animate-in zoom-in spin-in-90 duration-300" />
                                                ) : (
                                                    <Square size={28} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div className={`text-lg font-bold transition-all duration-300 ${
                                                        item.completed 
                                                        ? 'text-gray-500 line-through decoration-gray-600' // Subtle strike-through
                                                        : 'text-white'
                                                    }`}>
                                                        {item.name}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {item.completed && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onItemToggle(order.id, item.cartId);
                                                                }}
                                                                className="text-gray-500 hover:text-yellow-400 p-1 bg-gray-800/50 rounded border border-gray-600 hover:border-yellow-500/50 transition-colors"
                                                                title="Recall Item (Desfazer)"
                                                            >
                                                                <Undo2 size={16} />
                                                            </button>
                                                        )}
                                                        {isRelevantToStation && (
                                                            <button
                                                                onClick={(e) => handlePrintItem(e, item)}
                                                                className="text-gray-500 hover:text-purple-400 p-1"
                                                                title="Imprimir Item"
                                                            >
                                                                <Printer size={16} />
                                                            </button>
                                                        )}
                                                        {onSetPrepTime && isRelevantToStation && (
                                                            <button
                                                                onClick={(e) => handleSetPrepTime(e, item)}
                                                                className="text-gray-500 hover:text-blue-400 p-1"
                                                                title="Definir tempo de preparo"
                                                            >
                                                                <Timer size={16} />
                                                            </button>
                                                        )}
                                                        {item.estimatedPrepTime && (
                                                            <span className="text-xs font-bold bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                                                                {item.estimatedPrepTime}m
                                                            </span>
                                                        )}
                                                        <div className={`text-xs font-mono px-2 py-1 rounded ml-2 whitespace-nowrap uppercase ${
                                                            isRelevantToStation ? 'bg-blue-900 text-blue-100 border border-blue-700' : 'bg-gray-950 text-gray-500'
                                                        }`}>
                                                            {item.station}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {item.selectedModifiers.length > 0 && (
                                                    <div className={`text-sm mt-1 font-medium ${item.completed ? 'text-gray-600' : 'text-yellow-500'}`}>
                                                        {item.selectedModifiers.join(', ')}
                                                    </div>
                                                )}
                                                {item.note && (
                                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block mt-2 ${item.completed ? 'bg-gray-800 text-gray-500 border border-gray-700' : 'text-red-400 bg-red-900/20 border border-red-900/30'}`}>
                                                        OBS: {item.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div 
                className={`flex flex-col rounded-lg shadow-lg overflow-hidden transition-all duration-300 cursor-pointer relative ${containerClass}`}
                onClick={() => setIsExpanded(true)}
            >
                {/* Celebration Overlay */}
                {isCelebrating && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-600/95 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-white relative">
                            {/* Confetti / Particles */}
                            <div className="absolute -top-10 -left-10 text-yellow-300 animate-bounce delay-100"><Sparkles size={32} /></div>
                            <div className="absolute -top-4 -right-12 text-blue-300 animate-pulse"><Sparkles size={24} /></div>
                            <div className="absolute -bottom-8 -left-8 text-pink-300 animate-bounce delay-75"><Sparkles size={28} /></div>
                            
                            <div className="bg-white text-green-600 rounded-full p-4 shadow-2xl mb-2 animate-[bounce_0.5s_infinite]">
                                <CheckSquare size={48} strokeWidth={4} />
                            </div>
                            <span className="text-2xl font-black uppercase tracking-widest drop-shadow-md animate-in slide-in-from-bottom-2 duration-300">
                                {order.status === OrderStatus.PREPARING ? 'PRONTO!' : 'ENTREGUE!'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className={`p-3 flex justify-between items-start transition-colors duration-300 ${headerClass}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-white">#{order.order_number}</span>
                            {order.type === 'DELIVERY' && <span className="text-xs bg-orange-500 text-white px-1 rounded">DELIVERY</span>}
                            {order.type === 'TAKE_OUT' && <span className="text-xs bg-blue-500 text-white px-1 rounded">VIAGEM</span>}
                            
                            {/* Visual Priority Badges */}
                            {isPartial && (
                                <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-500 font-bold animate-pulse shadow-sm">
                                    <PackageOpen size={12} /> PARCIAL
                                </span>
                            )}
                            {isLate && (
                                <span className="flex items-center gap-1 text-xs bg-red-950 text-red-200 px-2 py-0.5 rounded border border-red-500 font-bold animate-pulse">
                                    <Siren size={12} /> ATRASADO
                                </span>
                            )}
                            {!isLate && isApproachingSLA && (
                                <span className="flex items-center gap-1 text-xs bg-yellow-900/50 text-yellow-200 px-2 py-0.5 rounded border border-yellow-500/50 font-bold">
                                    <AlertTriangle size={12} /> ATENÇÃO
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-300 truncate max-w-[150px]">{order.customer_name}</div>
                    </div>
                    <div className="text-right">
                        <OrderTimer elapsed={elapsed} slaMinutes={slaMinutes} />
                        {isReady && !isPartial && <div className="text-xs font-bold text-green-300 mt-1 animate-pulse">PRONTO</div>}
                        {isPartial && <div className="text-xs font-bold text-orange-300 mt-1">PENDENTE</div>}
                    </div>
                </div>

                {/* Items (Compact View) */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[300px] min-h-[150px]">
                    {visibleItems.map((item) => (
                        <div 
                            key={item.cartId}
                            onClick={(e) => {
                                // Keep row click for easy toggling if user prefers, but specific buttons are available
                                e.stopPropagation();
                                onItemToggle(order.id, item.cartId);
                            }}
                            className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-all duration-200 border border-transparent select-none relative overflow-hidden group ${
                                item.completed 
                                ? 'bg-black/20' // Subtle dim instead of high opacity
                                : isPartial 
                                    ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' 
                                    : 'hover:bg-white/5 active:scale-[0.98]'
                            }`}
                        >
                            {/* Checkbox Icon Indicator */}
                            <div className={`mt-0.5 relative transition-transform duration-300 group-hover:scale-105 ${item.completed ? 'text-green-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                {item.completed ? (
                                    <CheckSquare size={20} className="animate-in zoom-in spin-in-90 duration-200" />
                                ) : (
                                    <Square size={20} />
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div className={`font-bold text-lg leading-none transition-all duration-300 ${
                                        item.completed 
                                        ? 'text-gray-500 line-through decoration-gray-600' // Subtle strike-through
                                        : 'text-white'
                                    }`}>
                                        {item.name}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={(e) => handlePrintItem(e, item)}
                                            className="text-gray-600 hover:text-purple-400 p-0.5 rounded transition-colors"
                                            title="Imprimir Item"
                                        >
                                            <Printer size={14} />
                                        </button>
                                        {onSetPrepTime && !item.completed && (
                                            <button 
                                                onClick={(e) => handleSetPrepTime(e, item)}
                                                className="text-gray-600 hover:text-blue-400 p-0.5 rounded transition-colors"
                                                title="Ajustar tempo de preparo"
                                            >
                                                <Timer size={14} />
                                            </button>
                                        )}
                                        {item.estimatedPrepTime && (
                                            <span className="text-[10px] font-bold bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded ml-1">
                                                {item.estimatedPrepTime}m
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {item.selectedModifiers.length > 0 && (
                                    <div className={`text-sm mt-1 pl-1 border-l-2 transition-opacity duration-300 ${item.completed ? 'opacity-60 border-gray-600 text-gray-500' : 'text-yellow-500 border-yellow-600'}`}>
                                        {item.selectedModifiers.map(m => <div key={m}>{m}</div>)}
                                    </div>
                                )}
                                {item.note && (
                                    <div className={`text-xs font-bold px-1 rounded mt-1 inline-block transition-opacity duration-300 ${item.completed ? 'bg-gray-800 text-gray-500' : 'bg-red-900/30 text-red-400'}`}>
                                        OBS: {item.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Hidden Items Indicator */}
                    {hiddenCount > 0 && (
                        <div className="text-center text-xs text-gray-500 py-2 border-t border-gray-700/50 mt-2 italic flex items-center justify-center gap-2">
                            <Filter size={12} />
                            + {hiddenCount} itens em outras estações
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-2 bg-gray-900/50 border-t border-gray-700 flex gap-2">
                    {/* View Details Button (Explicit Addition per Request) */}
                     <button 
                        onClick={(e) => {
                             e.stopPropagation();
                             setIsExpanded(true);
                        }}
                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-blue-400 hover:text-blue-300 transition-colors"
                        title="Ver Detalhes"
                    >
                        <Eye size={18} />
                    </button>

                    {/* Print Button */}
                    <button 
                        onClick={handlePrintTicket}
                        className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-purple-400 hover:text-purple-300 transition-colors"
                        title="Imprimir Comanda"
                    >
                        <Printer size={18} />
                    </button>

                    {order.status !== OrderStatus.PAID && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const confirmRecall = window.confirm("Recall: Voltar pedido para status anterior?");
                                if(confirmRecall) onRecall(order.id);
                            }}
                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-yellow-500 hover:text-yellow-400 transition-colors border border-transparent hover:border-yellow-500/30"
                            title="Recall / Voltar Status"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}

                    {/* Partial Delivery Button */}
                    {order.items.length > 1 && (isReady || isPartial) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onBump(order.id, OrderStatus.PARTIAL);
                            }}
                            className={`p-3 rounded transition-colors flex flex-col items-center justify-center leading-none border ${
                                isPartial 
                                ? 'bg-orange-600 text-white border-orange-500 hover:bg-orange-700' 
                                : 'bg-gray-700 border-gray-600 hover:bg-orange-900 hover:border-orange-500 text-orange-400 hover:text-orange-200'
                            }`}
                            title={isPartial ? "Já está parcial" : "Marcar como Entrega Parcial"}
                        >
                            <PackageOpen size={18} />
                        </button>
                    )}
                    
                    <Button 
                        className={`flex-1 flex justify-center items-center py-4 text-lg uppercase tracking-wide font-bold shadow-none transition-all duration-300 ${
                            isReady 
                            ? 'bg-green-600 hover:bg-green-50 animate-pulse scale-[1.02] shadow-green-900/50 shadow-lg' 
                            : isPartial
                                ? 'bg-green-600 hover:bg-green-50 animate-pulse scale-[1.02] shadow-green-900/50 shadow-lg'
                                : allItemsDone 
                                    ? 'bg-green-600 hover:bg-green-50 animate-pulse scale-[1.02] shadow-green-900/50 shadow-lg' 
                                    : 'bg-blue-700 hover:bg-blue-600'
                        }`}
                        onClick={handleBumpWithAnimation}
                        disabled={isCelebrating}
                    >
                        {order.status === OrderStatus.PAID ? 'Iniciar' : (isReady || isPartial) ? 'Concluído' : 'Avançar'}
                    </Button>
                </div>
            </div>
        </>
    );
};