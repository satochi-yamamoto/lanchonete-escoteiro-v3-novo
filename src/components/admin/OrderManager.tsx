import React, { useState } from 'react';
import { useStore } from '../../store';
import { Badge, Button, Card, formatCurrency } from '../ui';
import { Search, Clock, ShoppingBag } from 'lucide-react';

export const OrderManager = () => {
    const { orders } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const filteredOrders = orders.filter(o => {
        const matchesSearch = 
            o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Pedidos</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar pedido..." 
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Todos os Status</option>
                        <option value="PENDING">Pendente</option>
                        <option value="PAID">Pago</option>
                        <option value="PREPARING">Preparando</option>
                        <option value="READY">Pronto</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                    </select>
                </div>
            </div>

            <Card className="overflow-hidden border-0 shadow-lg">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold"># Pedido</th>
                            <th className="p-4 font-bold">Cliente</th>
                            <th className="p-4 font-bold">Data/Hora</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold">Tipo</th>
                            <th className="p-4 font-bold text-right">Total</th>
                            <th className="p-4 font-bold text-center">Itens</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 font-bold text-gray-700">#{order.order_number}</td>
                                    <td className="p-4">
                                        <div className="font-medium">{order.customer_name || 'Cliente Balcão'}</div>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14}/>
                                            {new Date(order.created_at).toLocaleTimeString().slice(0,5)}
                                            <span className="text-xs opacity-70">{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge status={order.status} />
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            {order.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-800">
                                        {formatCurrency(order.total)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                                            <ShoppingBag size={12} /> {order.items.length}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};
