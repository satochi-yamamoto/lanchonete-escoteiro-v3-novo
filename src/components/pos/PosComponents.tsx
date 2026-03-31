import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, CartItem, ModifierGroup, Shift, Order, ShiftTransaction, PaymentMethod, Station } from '../../types';
import { Button, Card, formatCurrency } from '../ui';
import { X, ChevronLeft, Check, Plus, Minus, Trash2, Edit2, Banknote, CreditCard, Tag, Filter, QrCode, Printer, FileText, ArrowRight, Ban, Eye, EyeOff, Paperclip, Upload, Info, AlertTriangle, Calculator, Lock, DollarSign, Wallet, Coins, ArrowLeft, Save, Hash, Ticket, Globe } from 'lucide-react';

// --- Product Details Modal ---
interface ProductDetailsModalProps {
    product: Product;
    onClose: () => void;
}

const ProductDetailsModal = ({ product, onClose }: ProductDetailsModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="relative h-48 bg-gray-100 shrink-0">
                    {product.image && <img src={product.image} className="w-full h-full object-cover" alt={product.name} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white shadow-sm">{product.name}</h2>
                            <p className="text-white/90 font-medium">{product.category}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-2xl font-bold text-red-600">{formatCurrency(product.price)}</span>
                            <span className={`text-xs px-2 py-1 rounded font-bold ${product.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.is_available ? 'Disponível' : 'Indisponível'}
                            </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            {product.description || "Sem descrição disponível."}
                        </p>
                    </div>

                    {/* Modifiers Section */}
                    {product.modifiers && product.modifiers.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Edit2 size={16} /> Personalizações Disponíveis
                            </h3>
                            <div className="space-y-3">
                                {product.modifiers.map(mod => (
                                    <div key={mod.id}>
                                        <div className="text-sm font-semibold text-gray-700 mb-1">{mod.name}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {mod.options.map(opt => (
                                                <span key={opt.name} className="text-xs bg-white border px-2 py-1 rounded text-gray-600">
                                                    {opt.name} {opt.price > 0 && `(+${formatCurrency(opt.price)})`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recipe/Ingredients Section (Mock for visual) */}
                    {product.recipe && product.recipe.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <Tag size={16} /> Ficha Técnica Simplificada
                            </h3>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                                {product.recipe.map((r, idx) => (
                                    <li key={idx}>Ingrediente ID: {r.ingredient_id} (x{r.quantity})</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 text-right">
                    <Button onClick={onClose} variant="secondary">Fechar Detalhes</Button>
                </div>
            </div>
        </div>
    );
};

// --- Add Product Modal ---
interface AddProductModalProps {
    onClose: () => void;
    onSave: (p: Product) => void;
    categories: string[];
}

const AddProductModal = ({ onClose, onSave, categories }: AddProductModalProps) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(categories[0] || 'Lanches');
    const [station, setStation] = useState<any>('GRILL');

    const handleSave = () => {
        if (!name || !price) {
            alert("Nome e Preço são obrigatórios");
            return;
        }

        const newProduct: Product = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            price: parseFloat(price),
            category: category || 'Outros',
            station,
            is_available: true,
            image: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`,
            modifiers: [],
            recipe: []
        };
        onSave(newProduct);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Novo Produto Rápido</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                        <input 
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: X-Salada Especial"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                        <input 
                            type="number"
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <input 
                                list="categories"
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            />
                            <datalist id="categories">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estação</label>
                            <select 
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={station}
                                onChange={e => setStation(e.target.value as any)}
                            >
                                <option value="GRILL">GRILL</option>
                                <option value="FRYER">FRYER</option>
                                <option value="DRINKS">DRINKS</option>
                                <option value="ASSEMBLY">ASSEMBLY</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button variant="success" className="flex-1" onClick={handleSave}>Criar Produto</Button>
                </div>
            </div>
        </div>
    );
};

// --- Product Grid Component ---
export const ProductGrid = ({ products, onAdd, onCreateProduct }: { products: Product[], onAdd: (p: Product) => void, onCreateProduct?: (p: Product) => void }) => {
    const [category, setCategory] = useState<string>('Todos');
    const [stationFilter, setStationFilter] = useState<Station | 'ALL'>('ALL');
    const [showUnavailable, setShowUnavailable] = useState(false);
    
    // Animation State
    const [addedId, setAddedId] = useState<string | null>(null);
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const [isAdding, setIsAdding] = useState(false);
    const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

    const relevantProducts = showUnavailable ? products : products.filter(p => p.is_available);
    const categories = ['Todos', ...Array.from(new Set(relevantProducts.map(p => p.category)))];
    const uniqueCategories = Array.from(new Set(products.map(p => p.category))); // Keep full list for adding new products
    const stations: (Station | 'ALL')[] = ['ALL', 'GRILL', 'FRYER', 'DRINKS', 'ASSEMBLY'];

    const filtered = products.filter(p => {
        const matchCategory = category === 'Todos' || p.category === category;
        const matchStation = stationFilter === 'ALL' || p.station === stationFilter;
        // Logic: If showUnavailable is true, we show everything. If false, we ONLY show available.
        const matchAvailability = showUnavailable || p.is_available;
        return matchCategory && matchStation && matchAvailability;
    });

    const handleProductClick = (p: Product) => {
        if (!p.is_available) return; // Prevent adding if unavailable
        
        onAdd(p);
        
        // Handle Visual Feedback
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }

        setAddedId(null);
        setTimeout(() => {
            setAddedId(p.id);
            feedbackTimeoutRef.current = setTimeout(() => setAddedId(null), 350); // Slightly longer for better visibility
        }, 10);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col border-b">
                {/* Station Filter */}
                <div className="px-3 py-2 bg-gray-50 border-b flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 w-full">
                        <div className="flex items-center text-gray-400 mr-1">
                            <Filter size={14} />
                        </div>
                        {stations.map(s => (
                            <button
                                key={s}
                                onClick={() => setStationFilter(s)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all whitespace-nowrap ${
                                    stationFilter === s
                                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                    : 'bg-white border text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {s === 'ALL' ? 'TODAS' : s}
                            </button>
                        ))}
                    </div>

                    <div className="pl-0 md:pl-2 border-l-0 md:border-l ml-0 md:ml-2 flex gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
                        {/* New Product Button */}
                        {onCreateProduct && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="p-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 text-xs font-bold border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                                title="Adicionar Novo Produto"
                            >
                                <Plus size={14} />
                                Novo
                            </button>
                        )}
                        
                        <button
                            onClick={() => setShowUnavailable(!showUnavailable)}
                            className={`p-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 text-xs font-bold border ${
                                showUnavailable 
                                ? 'bg-gray-800 text-white border-gray-800' 
                                : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700'
                            }`}
                            title={showUnavailable ? "Ocultar produtos esgotados" : "Mostrar produtos esgotados"}
                        >
                             {showUnavailable ? <Eye size={14} /> : <EyeOff size={14} />}
                             {showUnavailable ? 'Esgotados' : 'Esgotados'}
                        </button>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="p-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(c => (
                        <button 
                            key={c} 
                            onClick={() => setCategory(c)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                category === c ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                    {/* Add New Product Card (Keep as well for visibility in empty state) */}
                    {onCreateProduct && (
                        <div 
                            onClick={() => setIsAdding(true)}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32 hover:bg-gray-50 cursor-pointer transition-colors text-gray-400 hover:text-gray-600 group bg-gray-50/50"
                        >
                            <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform text-blue-500 opacity-50 group-hover:opacity-100"/>
                            <span className="font-bold text-sm">Novo Produto</span>
                        </div>
                    )}

                    {filtered.map(p => {
                        const isAnimating = addedId === p.id;
                        const isUnavailable = !p.is_available;

                        return (
                            <div 
                                key={p.id} 
                                onClick={() => handleProductClick(p)}
                                className={`flex flex-col border rounded-lg overflow-hidden transition-all duration-150 relative group select-none ${
                                    isUnavailable 
                                    ? 'border-gray-200 opacity-60 bg-gray-50 grayscale-[0.8] cursor-not-allowed' // Stronger visual cue for unavailable
                                    : isAnimating 
                                        ? 'ring-4 ring-green-500 border-green-500 shadow-green-200/50 shadow-xl scale-[0.98] bg-green-50 z-20 cursor-pointer' // Pronounced active state
                                        : 'border-gray-100 hover:shadow-lg hover:-translate-y-1 active:scale-95 bg-white cursor-pointer'
                                }`}
                            >
                                {/* Enhanced "Added" Feedback Overlay */}
                                <div className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-all duration-200 ${isAnimating ? 'bg-green-500/20 backdrop-blur-[1px] opacity-100' : 'opacity-0'}`}>
                                    <div className={`transform transition-all duration-300 ${isAnimating ? 'scale-110 translate-y-0' : 'scale-0 translate-y-8'}`}>
                                        <div className="bg-white text-green-600 p-3 rounded-full shadow-2xl border-4 border-green-100 flex items-center gap-2">
                                            <Check size={28} strokeWidth={4} />
                                            <span className="font-black text-sm uppercase tracking-wider pr-1">Adicionado</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-24 bg-gray-100 w-full overflow-hidden relative">
                                    {p.image && <img src={p.image} className={`w-full h-full object-cover ${isUnavailable ? 'grayscale opacity-50' : ''}`} alt={p.name} />}
                                    
                                    {isUnavailable && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/20 backdrop-blur-[1px]">
                                            <div className="bg-red-600/90 text-white text-[11px] font-black px-3 py-1 rounded shadow-lg flex items-center gap-1 transform -rotate-3 border border-red-500 tracking-wider">
                                                <Ban size={12} strokeWidth={3} /> ESGOTADO
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-tl-lg font-bold backdrop-blur-sm">
                                        {p.station}
                                    </div>

                                    {/* Info / Details Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProductForDetails(p);
                                        }}
                                        className="absolute top-1 right-1 p-1.5 bg-white/80 hover:bg-white text-gray-600 rounded-full shadow-sm backdrop-blur-sm transition-colors z-20"
                                        title="Ver Detalhes"
                                    >
                                        <Info size={14} />
                                    </button>
                                </div>
                                <div className="p-2 relative">
                                    <h4 className={`font-bold text-sm line-clamp-1 ${isUnavailable ? 'text-gray-400 line-through decoration-gray-400/50' : 'text-gray-800'}`}>{p.name}</h4>
                                    <div className={`font-bold text-sm ${isUnavailable ? 'text-gray-400' : 'text-red-600'}`}>{formatCurrency(p.price)}</div>
                                    {/* Transparent Overlay for text area if unavailable */}
                                    {isUnavailable && <div className="absolute inset-0 bg-gray-100/30 pointer-events-none" />}
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-400 flex flex-col items-center">
                            <Filter size={32} className="mb-2 opacity-50"/>
                            Nenhum produto encontrado.
                            {!showUnavailable && <span className="text-xs mt-1">(Produtos esgotados estão ocultos)</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals Portal */}
            {isAdding && onCreateProduct && (
                <AddProductModal 
                    onClose={() => setIsAdding(false)}
                    onSave={(p) => {
                        onCreateProduct(p);
                        setIsAdding(false);
                    }}
                    categories={uniqueCategories}
                />
            )}

            {selectedProductForDetails && (
                <ProductDetailsModal 
                    product={selectedProductForDetails}
                    onClose={() => setSelectedProductForDetails(null)}
                />
            )}
        </div>
    );
};

// --- Cart Panel ---
export const CartPanel = ({ cart, totals, onRemove, onUpdate }: any) => {
  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center opacity-60">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🛒</span>
        </div>
        <p className="text-lg font-medium">Seu carrinho está vazio.</p>
        <p className="text-sm">Selecione produtos para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {cart.map((item: CartItem) => (
        <div key={item.cartId} className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-2 relative group hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="font-bold text-gray-800 leading-tight">{item.name}</h4>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                            {item.selectedModifiers.join(', ')}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="font-bold text-gray-800">{formatCurrency(item.price)}</div>
                </div>
            </div>
            
            {item.note && (
                <div className="text-xs bg-yellow-50 text-yellow-700 p-1.5 rounded border border-yellow-100 italic">
                    Obs: {item.note}
                </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t mt-1 opacity-100 transition-opacity">
                <button 
                    className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1"
                    onClick={() => {
                        const note = prompt("Adicionar observação:", item.note || "");
                        if (note !== null) onUpdate(item.cartId, { note });
                    }}
                >
                    <Edit2 size={12} /> Editar / Obs
                </button>
                <button 
                    onClick={() => onRemove(item.cartId)}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
      ))}
      
      {/* Summary Footer */}
      <div className="pt-4 mt-4 border-t space-y-2">
         <div className="flex justify-between text-gray-600">
             <span>Subtotal</span>
             <span>{formatCurrency(totals.subtotal)}</span>
         </div>
         {totals.discount > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
                <span>Descontos</span>
                <span>-{formatCurrency(totals.discount)}</span>
            </div>
         )}
         <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2 border-t border-dashed">
             <span>Total</span>
             <span>{formatCurrency(totals.total)}</span>
         </div>
      </div>
    </div>
  );
};

// --- Payment Modal ---
export const PaymentModal = ({ total, onCancel, onConfirm, activeMethods, isKiosk }: { total: number, onCancel: () => void, onConfirm: any, activeMethods?: PaymentMethod[], isKiosk?: boolean }) => {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [received, setReceived] = useState<string>('');
    const [customOrderId, setCustomOrderId] = useState('');
    const change = parseFloat(received || '0') - total;

    // Default to all if not provided (fallback)
    const availableMethods = activeMethods || [PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PIX];

    // Auto-select first available method if current selection is invalid
    useEffect(() => {
        if (availableMethods.length > 0 && (!method || !availableMethods.includes(method))) {
            setMethod(availableMethods[0]);
        }
    }, [availableMethods]);

    // Validation logic
    const isCash = method === PaymentMethod.CASH;
    const isConfirmDisabled = !method || (isCash && !isKiosk && change < 0);

    const allOptions = [
        { id: PaymentMethod.CASH, label: 'Dinheiro', icon: <Banknote /> },
        { id: PaymentMethod.CREDIT_CARD, label: 'Crédito', icon: <CreditCard /> },
        { id: PaymentMethod.DEBIT_CARD, label: 'Débito', icon: <CreditCard /> },
        { id: PaymentMethod.PIX, label: 'PIX', icon: <QrCode /> },
        { id: PaymentMethod.VOUCHER, label: 'Vale Refeição', icon: <Ticket /> }, 
        { id: PaymentMethod.ONLINE, label: 'Online', icon: <Globe /> } 
    ];

    // Filter options based on active settings
    const visibleOptions = allOptions.filter(opt => availableMethods.includes(opt.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-4xl h-full md:h-[650px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                {/* Left: Methods */}
                <div className="w-full md:w-1/3 bg-gray-50 border-r-0 md:border-r p-6 flex flex-col gap-3 shrink-0">
                    <h3 className="font-bold text-gray-500 mb-2 uppercase text-xs tracking-wider">Forma de Pagamento</h3>
                    
                    {visibleOptions.length === 0 && (
                        <div className="text-red-500 text-sm p-4 border border-red-200 bg-red-50 rounded">
                            Nenhum meio de pagamento ativo.
                        </div>
                    )}

                    {visibleOptions.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            className={`p-4 rounded-xl flex items-center gap-3 font-bold transition-all text-left ${
                                method === m.id 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                        >
                            {m.icon} {m.label}
                        </button>
                    ))}
                    
                    <div className="flex-1 md:flex-1"></div>
                    <Button variant="secondary" onClick={onCancel} className="mt-4 md:mt-0">Cancelar</Button>
                </div>

                {/* Right: Amount & Confirm */}
                <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center">
                    <div className="text-center mb-8">
                        <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Total a Pagar</div>
                        <div className="text-6xl font-black text-gray-800">{formatCurrency(total)}</div>
                    </div>

                    <div className="w-full max-w-xs space-y-4 mb-6">
                        {/* Custom Order ID Input - Hide in Kiosk */}
                        {!isKiosk && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Senha / Pager / Identificador (TV)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        type="text"
                                        className="w-full border-2 border-gray-200 p-2 pl-10 rounded-lg focus:border-blue-500 outline-none uppercase font-bold text-gray-800"
                                        placeholder="Ex: A2236, 10, JOHN"
                                        value={customOrderId}
                                        onChange={e => setCustomOrderId(e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        )}

                        {method === PaymentMethod.CASH && (
                            <>
                                {isKiosk ? (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                                        <div className="text-yellow-700 font-bold mb-1">Pagamento no Caixa</div>
                                        <p className="text-sm text-yellow-600">Retire sua senha e pague no balcão.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-gray-100 p-4 rounded-xl border-2 border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Valor Recebido</label>
                                            <input 
                                                type="number" 
                                                autoFocus
                                                className="w-full bg-transparent text-3xl font-bold outline-none text-gray-800"
                                                placeholder="0,00"
                                                value={received}
                                                onChange={e => setReceived(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className={`p-4 rounded-xl text-center ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
                                            <div className="text-xs font-bold uppercase mb-1">Troco</div>
                                            <div className="text-3xl font-bold">{formatCurrency(Math.max(0, change))}</div>
                                            {change < 0 && <div className="text-xs font-bold mt-1">Faltam {formatCurrency(Math.abs(change))}</div>}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    
                    {method === PaymentMethod.PIX && (
                         <div className="flex flex-col items-center text-center animate-in zoom-in duration-300 mb-6">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 mb-4 relative group cursor-pointer hover:border-blue-500 transition-colors">
                                <QrCode size={120} className="text-gray-800" />
                            </div>
                            <p className="font-bold text-gray-700 text-sm mb-1">Escaneie o QR Code</p>
                            <p className="text-gray-400 text-xs">Confirmação simulada.</p>
                        </div>
                    )}

                    {(method === PaymentMethod.CREDIT_CARD || method === PaymentMethod.DEBIT_CARD) && (
                        <div className="text-center text-gray-400 animate-pulse mb-6">
                            <CreditCard size={48} className="mx-auto mb-2 opacity-50"/>
                            <p className="text-sm">Aguardando máquina (TEF)...</p>
                        </div>
                    )}

                    <div className="mt-auto w-full max-w-xs">
                        <Button 
                            className={`w-full py-4 text-xl ${method === PaymentMethod.PIX ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : ''}`}
                            disabled={isConfirmDisabled}
                            onClick={() => onConfirm(method, method === PaymentMethod.CASH && !isKiosk ? parseFloat(received || '0') : total, customOrderId)}
                        >
                            {method === PaymentMethod.PIX ? 'CONFIRMAR (SIMULADO)' : 'CONFIRMAR PAGAMENTO'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Success Modal ---
export const SuccessModal = ({ order, paidAmount, onClose }: any) => {
    const change = paidAmount - order.total;
    
    // Auto close effect
    useEffect(() => {
        const timer = setTimeout(onClose, 5000); // Auto close after 5s
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-green-600/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-50 duration-300">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                    <Check size={48} strokeWidth={4} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Sucesso!</h2>
                <div className="bg-gray-100 rounded-lg p-2 mb-8 inline-block px-6">
                    <p className="text-gray-500 text-xs uppercase font-bold">Identificador / Senha</p>
                    <p className="text-4xl font-black text-gray-900 tracking-wider">{order.order_number}</p>
                </div>
                
                {change > 0 && (
                    <div className="bg-green-50 border border-green-100 p-6 rounded-2xl mb-8">
                        <div className="text-sm text-green-600 font-bold uppercase tracking-wider mb-2">Troco</div>
                        <div className="text-5xl font-bold text-green-700">{formatCurrency(change)}</div>
                    </div>
                )}

                <Button onClick={onClose} className="w-full py-4 text-lg">
                    Novo Pedido
                </Button>
            </div>
        </div>
    );
};

// --- Shift Panel ---
export const ShiftPanel = ({ shift, orders, onCloseShift, onTransaction, onClose }: any) => {
    const [view, setView] = useState<'OVERVIEW' | 'REIMBURSEMENT'>('OVERVIEW');
    
    // Reimbursement Form State
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [attachment, setAttachment] = useState<string | null>(null);

    // Filter orders for this shift
    const shiftOrders = orders.filter((o: Order) => o.shift_id === shift.id);
    const totalSales = shiftOrders.reduce((sum: number, o: Order) => sum + o.total, 0);

    // Calculate Total Reimbursement
    const reimbursements = shift.transactions.filter((t: ShiftTransaction) => t.type === 'REIMBURSEMENT');
    const totalReimbursed = reimbursements.reduce((sum: number, t: ShiftTransaction) => sum + t.amount, 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveReimbursement = () => {
        if (!payee || !amount) {
            alert("Preencha o nome e o valor.");
            return;
        }
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return alert("Valor inválido");

        onTransaction('REIMBURSEMENT', val, 'Reembolso Caixa', { 
            payee, 
            attachment: attachment || undefined 
        });

        // Reset and go back
        setPayee('');
        setAmount('');
        setAttachment(null);
        setView('OVERVIEW');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="bg-gray-900 text-white p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            {view === 'REIMBURSEMENT' && (
                                <button onClick={() => setView('OVERVIEW')} className="p-1 hover:bg-white/10 rounded-full">
                                    <ArrowLeft />
                                </button>
                            )}
                            <h2 className="text-2xl font-bold">{view === 'REIMBURSEMENT' ? 'Novo Reembolso' : 'Gestão de Turno'}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
                    </div>
                    
                    {view === 'OVERVIEW' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 p-4 rounded-xl">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Caixa Inicial</div>
                                <div className="text-xl font-bold">{formatCurrency(shift.start_cash)}</div>
                            </div>
                            <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30">
                                <div className="text-xs text-green-300 uppercase font-bold mb-1">Em Caixa (Teórico)</div>
                                <div className="text-xl font-bold text-green-400">{formatCurrency(shift.current_cash)}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-600/20 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-blue-300 uppercase font-bold mb-1">Total Reembolsado</div>
                                <div className="text-xl font-bold text-blue-100">{formatCurrency(totalReimbursed)}</div>
                            </div>
                            <div className="bg-blue-600 p-2 rounded-lg"><Wallet size={24}/></div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {view === 'OVERVIEW' ? (
                        <>
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={18}/> Movimentações</h3>
                            <div className="space-y-3 mb-8">
                                {shift.transactions.slice().reverse().map((t: ShiftTransaction) => (
                                    <div key={t.id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-gray-800">
                                                {t.type === 'SALE' ? 'Venda' : 
                                                 t.type === 'OPENING' ? 'Abertura' : 
                                                 t.type === 'DROP' ? 'Sangria' : 
                                                 t.type === 'REIMBURSEMENT' ? 'Reembolso' : 
                                                 'Suprimento'}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(t.time).toLocaleTimeString()} • {t.payee ? `Benef: ${t.payee}` : (t.reason || '-')}
                                            </div>
                                        </div>
                                        <div className={`font-mono font-bold ${
                                            ['SALE', 'ADD', 'OPENING'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {['SALE', 'ADD', 'OPENING'].includes(t.type) ? '+' : '-'}{formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Beneficiário</label>
                                <input 
                                    type="text"
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Motoboy, Fornecedor"
                                    value={payee}
                                    onChange={e => setPayee(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                                <input 
                                    type="number"
                                    className="w-full border p-3 rounded-lg text-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Comprovante (NF)</label>
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${attachment ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-100'}`}>
                                    <input 
                                        type="file" 
                                        id="reimburse-upload" 
                                        className="hidden" 
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="reimburse-upload" className="cursor-pointer block">
                                        {attachment ? (
                                            <div className="flex flex-col items-center gap-2 text-green-700">
                                                <Check size={24} />
                                                <span className="font-bold text-sm">Arquivo Anexado</span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setAttachment(null);
                                                    }}
                                                    className="text-xs text-red-500 hover:underline mt-2"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">
                                                <Upload className="mx-auto mb-2 opacity-50" />
                                                <span className="text-xs font-bold uppercase">Toque para anexar foto</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t space-y-3">
                    {view === 'OVERVIEW' ? (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" onClick={() => onTransaction('ADD')}>+ Suprimento</Button>
                                <Button variant="warning" onClick={() => onTransaction('DROP')}>- Sangria</Button>
                            </div>
                            <Button 
                                variant="secondary" 
                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" 
                                onClick={() => setView('REIMBURSEMENT')}
                            >
                                <Wallet size={16} className="mr-2 inline" /> Novo Reembolso
                            </Button>
                            <Button variant="danger" className="w-full mt-2" onClick={onCloseShift}>Gestão de Turno</Button>
                        </>
                    ) : (
                        <Button 
                            className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                            onClick={handleSaveReimbursement}
                        >
                            <Save size={20} className="mr-2 inline" /> Registrar Saída
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Cash Closing Report Modal (Read-Only) ---
export const CashClosingReportModal = ({ shift, orders, onClose }: any) => {
    const shiftOrders = orders.filter((o: Order) => o.shift_id === shift.id);
    const totalSales = shiftOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
    const orderCount = shiftOrders.length;
    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

    const paymentBreakdown = Object.values(PaymentMethod).map(method => {
        const amount = shiftOrders
            .filter((o: Order) => o.payment_method === method)
            .reduce((sum: number, o: Order) => sum + o.total, 0);
        return { method, amount };
    }).filter(x => x.amount > 0);

    const drops = shift.transactions.filter((t: ShiftTransaction) => t.type === 'DROP').reduce((s: number, t: ShiftTransaction) => s + t.amount, 0);
    const supplies = shift.transactions.filter((t: ShiftTransaction) => t.type === 'ADD').reduce((s: number, t: ShiftTransaction) => s + t.amount, 0);
    const reimbursements = shift.transactions.filter((t: ShiftTransaction) => t.type === 'REIMBURSEMENT').reduce((s: number, t: ShiftTransaction) => s + t.amount, 0);

    // Items sold breakdown: group all CartItems from shift orders by product name
    const itemsSoldMap: Record<string, { qty: number; revenue: number }> = {};
    shiftOrders.forEach((o: Order) => {
        (o.items as CartItem[]).forEach((item) => {
            if (!itemsSoldMap[item.name]) itemsSoldMap[item.name] = { qty: 0, revenue: 0 };
            itemsSoldMap[item.name].qty += 1;
            itemsSoldMap[item.name].revenue += item.price;
        });
    });
    const itemsSoldList = Object.entries(itemsSoldMap)
        .map(([name, data]) => ({ name, qty: data.qty, revenue: data.revenue }))
        .sort((a, b) => b.qty - a.qty);
    const totalItemsQty = itemsSoldList.reduce((s, i) => s + i.qty, 0);
    const totalItemsRevenue = itemsSoldList.reduce((s, i) => s + i.revenue, 0);

    // Resumo Financeiro
    const pixSales = shiftOrders.filter((o: Order) => o.payment_method === PaymentMethod.PIX).reduce((s: number, o: Order) => s + o.total, 0);
    const cashSales = shiftOrders.filter((o: Order) => o.payment_method === PaymentMethod.CASH).reduce((s: number, o: Order) => s + o.total, 0);
    const otherSales = totalSales - pixSales - cashSales;
    const netTransactions = supplies - drops - reimbursements;
    const saldoFinal = shift.start_cash + totalSales + netTransactions;
    const lucroFinal = totalSales;

    const [showPreview, setShowPreview] = useState(false);

    const generateReportLines = () => [
        "================================",
        "   RELATÓRIO DE FECHAMENTO DE   ",
        "            CAIXA               ",
        "================================",
        `LOJA: MATRIZ - TERM: ${shift.terminal_id}`,
        `DATA: ${new Date().toLocaleString()}`,
        `OPERADOR: ${shift.staff_name}`,
        "--------------------------------",
        `VENDAS TOTAIS:    ${formatCurrency(totalSales)}`,
        `QTD PEDIDOS:      ${orderCount}`,
        `TICKET MÉDIO:     ${formatCurrency(avgTicket)}`,
        "--------------------------------",
        "VENDAS POR PRODUTO:",
        ...itemsSoldList.map(item =>
            `${item.name.substring(0, 18).padEnd(18)} x${String(item.qty).padStart(3)}  ${formatCurrency(item.revenue).padStart(8)}`
        ),
        `${'TOTAL'.padEnd(18)} x${String(totalItemsQty).padStart(3)}  ${formatCurrency(totalItemsRevenue).padStart(8)}`,
        "--------------------------------",
        "DETALHE POR PAGAMENTO:",
        ...paymentBreakdown.map(p =>
            `${p.method.padEnd(15)} ${formatCurrency(p.amount).padStart(10)}`
        ),
        "--------------------------------",
        "MOVIMENTAÇÃO DE CAIXA:",
        `SALDO INICIAL:    ${formatCurrency(shift.start_cash)}`,
        `SUPRIMENTOS:     +${formatCurrency(supplies)}`,
        `SANGRIAS:        -${formatCurrency(drops)}`,
        `REEMBOLSOS:      -${formatCurrency(reimbursements)}`,
        "--------------------------------",
        `CAIXA TEÓRICO:    ${formatCurrency(shift.current_cash)}`,
        "--------------------------------",
        "RESUMO FINANCEIRO:",
        `PIX:              ${formatCurrency(pixSales).padStart(10)}`,
        `DINHEIRO:         ${formatCurrency(cashSales).padStart(10)}`,
        `OUTROS (CARTOES): ${formatCurrency(otherSales).padStart(10)}`,
        `FUNDO ABERTURA:   ${formatCurrency(shift.start_cash).padStart(10)}`,
        `MOV. EXTRAS:     ${(netTransactions >= 0 ? '+' : '') + formatCurrency(netTransactions).padStart(10)}`,
        "--------------------------------",
        `FATURAMENTO:      ${formatCurrency(totalSales).padStart(10)}`,
        `SALDO FINAL:      ${formatCurrency(saldoFinal).padStart(10)}`,
        `LUCRO FINAL:      ${formatCurrency(lucroFinal).padStart(10)}`,
        "================================",
        "        FIM DO RELATÓRIO        "
    ];

    const handlePrint = () => {
        const reportContent = generateReportLines().join('\n');
        const printWindow = window.open('', '', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html><head>
                    <title>Fechamento de Caixa - ${shift.terminal_id}</title>
                    <style>body { font-family: monospace; white-space: pre; margin: 20px; font-size: 14px; color: #000; } @media print { body { margin: 0; } @page { margin: 0; } }</style>
                </head><body>${reportContent}</body></html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        } else {
            alert("A janela de impressão foi bloqueada pelo navegador.");
        }
    };

    if (showPreview) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                    <div className="bg-blue-800 text-white p-4 flex justify-between items-center shrink-0">
                        <h2 className="text-lg font-bold flex items-center gap-2"><Printer size={18}/> Prévia de Impressão</h2>
                        <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-white/20 rounded"><X size={20}/></button>
                    </div>
                    <div className="p-6 bg-gray-100 flex justify-center">
                        <div className="bg-white p-6 shadow-md font-mono text-sm leading-relaxed whitespace-pre w-full overflow-x-auto text-gray-800 border-t-4 border-blue-800">
                            {generateReportLines().join('\n')}
                        </div>
                    </div>
                    <div className="p-4 bg-white border-t flex gap-3 justify-end shrink-0">
                        <Button variant="secondary" onClick={() => setShowPreview(false)}>Voltar</Button>
                        <Button variant="primary" onClick={handlePrint} className="flex gap-2 items-center bg-blue-800 hover:bg-blue-900 text-white">
                            <Printer size={18} /> IMPRIMIR AGORA
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="bg-blue-800 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Relatório de Fechamento de Caixa</h2>
                        <p className="opacity-80 text-sm font-mono uppercase tracking-widest">{shift.terminal_id} • {shift.staff_name}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Vendas</div>
                            <div className="text-2xl font-black text-gray-800">{formatCurrency(totalSales)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-1">Pedidos</div>
                            <div className="text-2xl font-black text-gray-800">{orderCount}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-1">Ticket Médio</div>
                            <div className="text-2xl font-black text-gray-800">{formatCurrency(avgTicket)}</div>
                        </div>
                    </div>

                    {/* Items Sold Breakdown */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <FileText size={18} /> Vendas por Produto
                        </h3>
                        {itemsSoldList.length === 0 ? (
                            <div className="text-gray-400 italic text-sm">Nenhuma venda registrada.</div>
                        ) : (
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-bold text-gray-600">Produto</th>
                                            <th className="text-center px-4 py-2 font-bold text-gray-600">Qtd</th>
                                            <th className="text-right px-4 py-2 font-bold text-gray-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {itemsSoldList.map((item) => (
                                            <tr key={item.name} className="bg-white hover:bg-gray-50">
                                                <td className="px-4 py-2 text-gray-800">{item.name}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                                                        {item.qty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-gray-800">{formatCurrency(item.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                                        <tr>
                                            <td className="px-4 py-2 font-black text-gray-800 uppercase text-xs">Total</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs">
                                                    {totalItemsQty}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-black text-gray-900">{formatCurrency(totalItemsRevenue)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Wallet size={18} /> Detalhamento por Pagamento
                            </h3>
                            <div className="space-y-2">
                                {paymentBreakdown.map((pb) => (
                                    <div key={pb.method} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                        <span className="text-sm font-medium text-gray-600">{pb.method}</span>
                                        <span className="font-bold text-gray-800">{formatCurrency(pb.amount)}</span>
                                    </div>
                                ))}
                                {paymentBreakdown.length === 0 && (
                                    <div className="text-gray-400 italic text-sm">Nenhuma venda registrada.</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Coins size={18} /> Conferência de Gaveta
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3 border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Fundo Inicial</span>
                                    <span className="font-medium">{formatCurrency(shift.start_cash)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Saídas / Sangrias</span>
                                    <span>-{formatCurrency(drops)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-blue-600">
                                    <span>Reembolsos</span>
                                    <span>-{formatCurrency(reimbursements)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Entradas / Suprimentos</span>
                                    <span>+{formatCurrency(supplies)}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                    <span className="font-bold text-gray-800 uppercase text-xs">Esperado em Dinheiro</span>
                                    <span className="font-black text-xl text-blue-600">{formatCurrency(shift.current_cash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                            <DollarSign size={16} className="text-gray-600" />
                            <span className="font-bold text-gray-700 text-sm">Resumo Financeiro</span>
                        </div>
                        <div className="divide-y text-sm">
                            <div className="flex justify-between px-4 py-2">
                                <span className="text-blue-600">Total Vendas PIX</span>
                                <span className="font-medium text-gray-800">{formatCurrency(pixSales)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2">
                                <span className="text-green-600">Total Vendas Dinheiro</span>
                                <span className="font-medium text-gray-800">{formatCurrency(cashSales)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2">
                                <span className="text-gray-500">Total Outros (Cartões)</span>
                                <span className="font-medium text-gray-800">{formatCurrency(otherSales)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2">
                                <span className="text-gray-500">Fundo de Abertura</span>
                                <span className="font-medium text-gray-800">{formatCurrency(shift.start_cash)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2">
                                <span className="text-orange-500">Movimentações Extras (Sup/Sang/Reemb)</span>
                                <span className={`font-medium ${netTransactions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {netTransactions >= 0 ? '+' : ''}{formatCurrency(netTransactions)}
                                </span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-gray-50">
                                <span className="font-bold text-gray-800">Faturamento</span>
                                <span className="font-black text-green-600 text-base">{formatCurrency(totalSales)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-gray-50">
                                <span className="font-bold text-gray-800">Saldo Final</span>
                                <span className="font-black text-blue-600 text-base">{formatCurrency(saldoFinal)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 bg-gray-50">
                                <span className="font-bold text-gray-800">Lucro Final</span>
                                <span className="font-black text-purple-600 text-base">{formatCurrency(lucroFinal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-gray-50 border-t flex gap-4 shrink-0">
                    <Button variant="secondary" onClick={() => setShowPreview(true)} className="flex gap-2 items-center">
                        <Printer size={18} /> Imprimir
                    </Button>
                    <div className="flex-1" />
                    <Button variant="secondary" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </div>
    );
};

// --- ZReport Modal ---
export const ZReportModal = ({ shift, orders, onClose, onConfirmClose }: any) => {
    const [metrics, setMetrics] = useState({
        drinks_liters: '',
        burger_cost: '',
        burgers_produced: '',
        burgers_unsold: '',
        menu_name: '',
        closer_name: '',
        feedback: ''
    });

    // 1. Filter Data
    const shiftOrders = orders.filter((o: Order) => o.shift_id === shift.id);
    
    // 2. Calculate KPI
    const totalSales = shiftOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
    const orderCount = shiftOrders.length;
    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
    
    // 3. Payment Breakdown
    const paymentBreakdown = Object.values(PaymentMethod).map(method => {
        const amount = shiftOrders
            .filter((o: Order) => o.payment_method === method)
            .reduce((sum: number, o: Order) => sum + o.total, 0);
        return { method, amount };
    }).filter(x => x.amount > 0);

    // 4. Cash Logic
    const drops = shift.transactions.filter((t: ShiftTransaction) => t.type === 'DROP').reduce((s: number, t: ShiftTransaction) => s + t.amount, 0);
    const supplies = shift.transactions.filter((t: ShiftTransaction) => t.type === 'ADD').reduce((s: number, t: ShiftTransaction) => s + t.amount, 0);
    const reimbursements = shift.transactions.filter((t: ShiftTransaction) => t.type === 'REIMBURSEMENT').reduce((s: number, t: ShiftTransaction) => s + t.amount, 0);
    // Note: store.current_cash tracks theoretical drawer (Start + Cash Sales + Supplies - Drops)
    
    const [showPreview, setShowPreview] = useState(false);

    const generateReportLines = () => {
        return [
            "================================",
            "      RELATÓRIO DE FECHAMENTO   ",
            "             REDUÇÃO Z          ",
            "================================",
            `LOJA: MATRIZ - TERM: ${shift.terminal_id}`,
            `DATA: ${new Date().toLocaleString()}`,
            `OPERADOR: ${shift.staff_name}`,
            "--------------------------------",
            `VENDAS TOTAIS:    ${formatCurrency(totalSales)}`,
            `QTD PEDIDOS:      ${orderCount}`,
            `TICKET MÉDIO:     ${formatCurrency(avgTicket)}`,
            "--------------------------------",
            "DETALHE POR PAGAMENTO:",
            ...paymentBreakdown.map(p => 
                `${p.method.padEnd(15)} ${formatCurrency(p.amount).padStart(10)}`
            ),
            "--------------------------------",
            "MOVIMENTAÇÃO DE CAIXA:",
            `SALDO INICIAL:    ${formatCurrency(shift.start_cash)}`,
            `SUPRIMENTOS:     +${formatCurrency(supplies)}`,
            `SANGRIAS:        -${formatCurrency(drops)}`,
            `REEMBOLSOS:      -${formatCurrency(reimbursements)}`,
            "--------------------------------",
            `CAIXA TEÓRICO:    ${formatCurrency(shift.current_cash)}`,
            "================================",
            "        FIM DO RELATÓRIO        "
        ];
    };

    const handlePrint = () => {
        setShowPreview(true);
    };

    const confirmPrint = () => {
        const reportContent = generateReportLines().join('\n');
        console.log(reportContent);
        
        // Abrir uma nova janela formatada para impressão
        const printWindow = window.open('', '', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Redução Z - ${shift.terminal_id}</title>
                        <style>
                            body {
                                font-family: monospace;
                                white-space: pre;
                                margin: 20px;
                                font-size: 14px;
                                color: #000;
                            }
                            @media print {
                                body { margin: 0; }
                                @page { margin: 0; }
                            }
                        </style>
                    </head>
                    <body>${reportContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        } else {
            alert("A janela de impressão foi bloqueada pelo navegador.");
        }
        
        setShowPreview(false);
    };

    if (showPreview) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                    <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                        <h2 className="text-lg font-bold flex items-center gap-2"><Printer size={18}/> Prévia de Impressão</h2>
                        <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-white/20 rounded"><X size={20}/></button>
                    </div>
                    <div className="p-6 bg-gray-100 flex justify-center">
                        <div className="bg-white p-6 shadow-md font-mono text-sm leading-relaxed whitespace-pre w-full overflow-x-auto text-gray-800 border-t-4 border-gray-800">
                            {generateReportLines().join('\n')}
                        </div>
                    </div>
                    <div className="p-4 bg-white border-t flex gap-3 justify-end shrink-0">
                        <Button variant="secondary" onClick={() => setShowPreview(false)}>Voltar</Button>
                        <Button variant="primary" onClick={confirmPrint} className="flex gap-2 items-center bg-gray-800 hover:bg-gray-900 text-white">
                            <Printer size={18} /> IMPRIMIR AGORA
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="bg-red-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Gestão de Turno</h2>
                        <p className="opacity-80 text-sm font-mono uppercase tracking-widest">ID: {shift.id} • {shift.staff_name}</p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                        <Lock size={24} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
                    
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Vendas</div>
                            <div className="text-2xl font-black text-gray-800">{formatCurrency(totalSales)}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-1">Pedidos</div>
                            <div className="text-2xl font-black text-gray-800">{orderCount}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border text-center">
                            <div className="text-gray-500 text-xs font-bold uppercase mb-1">Ticket Médio</div>
                            <div className="text-2xl font-black text-gray-800">{formatCurrency(avgTicket)}</div>
                        </div>
                    </div>

                    {/* Shift Metrics Form */}
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <FileText size={18} /> Métricas do Turno
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-blue-800 mb-1">Nome completo da pessoa que preenche este formulário</label>
                                <input 
                                    type="text"
                                    className="w-full border p-2 rounded-lg"
                                    value={metrics.closer_name}
                                    onChange={e => setMetrics({...metrics, closer_name: e.target.value})}
                                    placeholder="Ex: João da Silva"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-blue-800 mb-1">Cardápio do Lanche</label>
                                <input 
                                    type="text"
                                    className="w-full border p-2 rounded-lg"
                                    value={metrics.menu_name}
                                    onChange={e => setMetrics({...metrics, menu_name: e.target.value})}
                                    placeholder="Ex: Hambúrguer Artesanal e Refrigerante"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Quantos litros de bebida?</label>
                                <input 
                                    type="number" step="0.1"
                                    className="w-full border p-2 rounded-lg"
                                    value={metrics.drinks_liters}
                                    onChange={e => setMetrics({...metrics, drinks_liters: e.target.value})}
                                    placeholder="Ex: 15.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Preço de custo do lanche (R$)?</label>
                                <input 
                                    type="number" step="0.01"
                                    className="w-full border p-2 rounded-lg"
                                    value={metrics.burger_cost}
                                    onChange={e => setMetrics({...metrics, burger_cost: e.target.value})}
                                    placeholder="Ex: 8.50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Total de lanches produzidos?</label>
                                <input 
                                    type="number"
                                    className="w-full border p-2 rounded-lg"
                                    value={metrics.burgers_produced}
                                    onChange={e => setMetrics({...metrics, burgers_produced: e.target.value})}
                                    placeholder="Ex: 50"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-blue-800 mb-1">Feedback</label>
                                <textarea 
                                    className="w-full border p-2 rounded-lg"
                                    rows={2}
                                    value={metrics.feedback}
                                    onChange={e => setMetrics({...metrics, feedback: e.target.value})}
                                    placeholder="Observações do turno..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Payment Breakdown */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Wallet size={18} /> Detalhamento
                            </h3>
                            <div className="space-y-2">
                                {paymentBreakdown.map((pb) => (
                                    <div key={pb.method} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                        <span className="text-sm font-medium text-gray-600">{pb.method}</span>
                                        <span className="font-bold text-gray-800">{formatCurrency(pb.amount)}</span>
                                    </div>
                                ))}
                                {paymentBreakdown.length === 0 && (
                                    <div className="text-gray-400 italic text-sm">Nenhuma venda registrada.</div>
                                )}
                            </div>
                        </div>

                        {/* Cash Drawer Reconcile */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Coins size={18} /> Conferência de Gaveta
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3 border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Fundo Inicial</span>
                                    <span className="font-medium">{formatCurrency(shift.start_cash)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Saídas / Sangrias</span>
                                    <span>-{formatCurrency(drops)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-blue-600">
                                    <span>Reembolsos</span>
                                    <span>-{formatCurrency(reimbursements)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Entradas / Suprimentos</span>
                                    <span>+{formatCurrency(supplies)}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                    <span className="font-bold text-gray-800 uppercase text-xs">Esperado em Dinheiro</span>
                                    <span className="font-black text-xl text-blue-600">{formatCurrency(shift.current_cash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md flex gap-3 text-sm text-yellow-800">
                        <AlertTriangle className="shrink-0" size={20} />
                        <p>Atenção: A conferência cega não foi habilitada. O sistema assumirá que os valores em gaveta correspondem ao valor teórico acima.</p>
                    </div>
                </div>

                <div className="p-4 md:p-6 bg-gray-50 border-t flex flex-col sm:flex-row gap-4 shrink-0">
                    <Button variant="secondary" onClick={handlePrint} className="flex justify-center gap-2 items-center w-full sm:w-auto">
                        <Printer size={18} /> Imprimir Prévia
                    </Button>
                    <div className="hidden sm:block flex-1"></div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">Voltar</Button>
                        <Button variant="danger" className="flex-1 sm:flex-none px-4 sm:px-8 shadow-red-200" onClick={() => {
                        const payload = {
                            drinks_liters: metrics.drinks_liters ? parseFloat(metrics.drinks_liters) : undefined,
                            burger_cost: metrics.burger_cost ? parseFloat(metrics.burger_cost) : undefined,
                            burgers_produced: metrics.burgers_produced ? parseInt(metrics.burgers_produced) : undefined,
                            menu_name: metrics.menu_name || undefined,
                            closer_name: metrics.closer_name || undefined,
                            feedback: metrics.feedback || undefined
                        };
                        onConfirmClose(payload);
                    }}>
                        CONFIRMAR FECHAMENTO
                    </Button>
                </div>
             </div>
        </div>
    </div>
    );
};