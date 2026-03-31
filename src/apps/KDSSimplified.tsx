import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { OrderStatus } from '../types';
import { Button, playSound } from '../components/ui';
import { LogOut, Bell, Volume2, VolumeX, CheckSquare, Square, Clock } from 'lucide-react';

const SimpleItemTicket = ({ order, item, soundEnabled, onCompleteItem }: any) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const updateElapsed = () => {
            const startTime = order.created_at;
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);
        return () => clearInterval(interval);
    }, [order.created_at]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const isLate = elapsed > 5 * 60; // 5 minutos default

    return (
        <div 
            onClick={() => {
                if (soundEnabled) playSound('success');
                onCompleteItem(order.id, item.cartId);
            }}
            className={`rounded-2xl overflow-hidden shadow-xl border-4 cursor-pointer transition-all active:scale-95 flex flex-col h-full ${
                isLate 
                ? 'border-red-500 bg-red-900/20 shadow-red-900/50 animate-[pulse_2s_ease-in-out_infinite]' 
                : 'border-gray-600 bg-gray-800 hover:border-purple-500'
            }`}
        >
            <div className={`p-4 flex justify-between items-center border-b ${isLate ? 'bg-red-600 border-red-500' : 'bg-gray-700 border-gray-600'}`}>
                <div>
                    <div className="text-3xl font-black text-white">#{order.id.slice(-4)}</div>
                    <div className="text-gray-300 text-lg font-bold uppercase">{order.customer_name || 'Balcão'}</div>
                </div>
                <div className={`flex flex-col items-end gap-1 font-bold ${isLate ? 'text-white' : 'text-gray-300'}`}>
                    <div className="flex items-center gap-2 text-2xl">
                        <Clock size={24} />
                        {formatTime(elapsed)}
                    </div>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center gap-4">
                <div className="text-5xl font-black text-white">
                    <span className="text-purple-400 mr-2">{item.quantity}x</span> 
                    {item.name}
                </div>
                {item.notes && (
                    <div className="bg-yellow-500/20 text-yellow-400 p-4 rounded-xl text-2xl font-bold italic w-full border border-yellow-500/30">
                        {item.notes}
                    </div>
                )}
            </div>

            <div className={`p-6 text-center font-black text-2xl tracking-widest ${isLate ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300'}`}>
                TOCAR PARA CONCLUIR
            </div>
        </div>
    );
};

export const KDSSimplified = ({ onExit }: { onExit?: () => void }) => {
    const { orders, currentSession, updateOrderStatus, toggleOrderItemComplete } = useStore();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    
    const previousOrderIds = useRef<Set<string>>(new Set());
    const isFirstRender = useRef(true);

    // Filtra apenas pedidos pagos que não foram entregues ou cancelados
    const pendingOrders = orders.filter(o => {
        if (!currentSession) return false;
        if (o.session_id !== currentSession.id) return false;
        return [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.PARTIAL].includes(o.status);
    }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Achata todos os itens pendentes de todos os pedidos em uma única lista
    const pendingItems = pendingOrders.flatMap(order => 
        order.items
            .filter(item => !item.completed)
            .map(item => ({
                order,
                item
            }))
    );

    // Alerta sonoro
    useEffect(() => {
        const incomingOrders = orders.filter(o => o.status === OrderStatus.PAID);
        const currentIds = new Set<string>(incomingOrders.map(o => o.id));
        
        let isNew = false;
        for (const id of currentIds) {
            if (!previousOrderIds.current.has(id)) {
                isNew = true;
                break;
            }
        }
        
        if (isFirstRender.current) {
            isFirstRender.current = false;
            previousOrderIds.current = currentIds;
            return;
        }

        if (isNew) {
            if (soundEnabled) playSound('new_order');
            setNewOrderAlert(true);
            const timer = setTimeout(() => setNewOrderAlert(false), 5000);
            return () => clearTimeout(timer);
        }
        
        previousOrderIds.current = currentIds;
    }, [orders, soundEnabled]);

    const handleCompleteItem = (orderId: string, cartId: string) => {
        // Marca o item como concluído
        toggleOrderItemComplete(orderId, cartId);
        
        // Verifica se este era o último item do pedido
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const allCompleted = order.items.every(i => i.cartId === cartId || i.completed);
            if (allCompleted) {
                // Se todos os itens estão prontos, finaliza o pedido automaticamente
                updateOrderStatus(orderId, OrderStatus.DELIVERED);
            } else if (order.status === OrderStatus.PAID) {
                // Se o pedido acabou de começar a ser feito, move para PREPARING
                updateOrderStatus(orderId, OrderStatus.PREPARING);
            }
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 overflow-hidden text-white selection:bg-purple-500/30">
            {/* Header */}
            <div className="bg-gray-800 p-4 shadow-md flex justify-between items-center z-10 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-2xl tracking-tighter px-4 py-2 rounded-xl shadow-lg border border-purple-500/30 flex items-center gap-2">
                        <span>OMNI</span>
                        <span className="text-purple-200">KDS SIMPLIFICADO</span>
                    </div>
                    
                    {newOrderAlert && (
                        <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-green-500/50 animate-pulse">
                            <Bell size={18} className="animate-bounce" /> Novo Pedido!
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-600 flex gap-4">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Clock size={16}/> Lanches: <span className="font-black text-lg">{pendingItems.length}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-purple-600 text-white shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-[0_0px_0_rgb(147,51,234)]' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}
                        title={soundEnabled ? "Mudo" : "Ativar Som"}
                    >
                        {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    </button>

                    <Button variant="danger" onClick={onExit} className="flex gap-2 items-center px-6 py-3 shadow-[0_4px_0_rgb(220,38,38)] active:translate-y-1 active:shadow-[0_0px_0_rgb(220,38,38)] transition-all">
                        <LogOut size={20} /> SAIR
                    </Button>
                </div>
            </div>

            {/* Main Content - Grid Layout for Items */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-gradient-to-br from-gray-900 to-black">
                {pendingItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <CheckSquare size={80} className="mb-6 opacity-20" />
                        <p className="text-3xl font-bold tracking-widest uppercase">Nenhum Lanche Pendente</p>
                        <p className="text-xl mt-2 font-light">A cozinha está livre!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max h-full overflow-y-auto pb-24 pr-4">
                        {pendingItems.map(({ order, item }) => (
                            <SimpleItemTicket 
                                key={`${order.id}-${item.cartId}`} 
                                order={order} 
                                item={item}
                                soundEnabled={soundEnabled}
                                onCompleteItem={handleCompleteItem} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
