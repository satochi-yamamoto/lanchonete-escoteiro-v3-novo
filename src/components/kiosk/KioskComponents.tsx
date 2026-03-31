import React, { useState, useEffect } from 'react';
import { Product, CartItem, ModifierGroup } from '../../types';
import { formatCurrency } from '../ui';
import { X, ChevronLeft, Check, Plus, Minus } from 'lucide-react';

// --- Splash Screen ---
export const Splash = ({ onStart }: { onStart: () => void }) => (
  <div onClick={onStart} className="h-screen w-full bg-red-600 flex flex-col items-center justify-center text-white cursor-pointer animate-in fade-in duration-500">
    <div className="text-9xl mb-8">🍔</div>
    <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tighter text-center px-4">Lanchonete Escoteiros Cooper</h1>
    <p className="text-2xl opacity-90 animate-pulse">Toque para Iniciar</p>
  </div>
);

// --- Category Navigation ---
export const CategoryNav = ({ categories, active, onSelect }: any) => (
  <div className="flex gap-4 p-6 overflow-x-auto no-scrollbar bg-white shadow-sm z-10">
    {categories.map((cat: string) => (
      <button
        key={cat}
        onClick={() => onSelect(cat)}
        className={`px-8 py-4 text-xl rounded-full font-bold whitespace-nowrap transition-all transform active:scale-95 ${
          active === cat 
          ? 'bg-red-600 text-white shadow-lg scale-105' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
);

// --- Product Card ---
export const KioskProductCard = ({ product, onClick }: { product: Product, onClick: () => void }) => (
  <div 
    onClick={onClick} 
    className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all flex flex-col items-center text-center h-full justify-between"
  >
    <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
        {product.image && <img src={product.image} className="w-full h-full object-cover" alt={product.name} />}
        {!product.is_available && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-gray-400 text-xl">
                Indisponível
            </div>
        )}
    </div>
    <div className="w-full">
        <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-2xl text-red-600 font-bold">{formatCurrency(product.price)}</p>
    </div>
  </div>
);

// --- Product Customization Modal ---
export const ProductCustomizer = ({ product, onClose, onConfirm }: { product: Product, onClose: () => void, onConfirm: (p: Product, mods: string[]) => void }) => {
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());

  const toggleMod = (modName: string, group: ModifierGroup) => {
    const newSet = new Set(selectedMods);
    
    // Check Max limit logic implies Radio vs Checkbox
    if (group.max === 1) {
        // Remove other options from this group
        group.options.forEach(opt => newSet.delete(opt.name));
        newSet.add(modName);
    } else {
        // Toggle logic
        if (newSet.has(modName)) {
            newSet.delete(modName);
        } else {
            // Check max limit
            const currentInGroup = group.options.filter(o => newSet.has(o.name)).length;
            if (currentInGroup < group.max) {
                newSet.add(modName);
            }
        }
    }
    setSelectedMods(newSet);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-white w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="relative h-64 bg-gray-100 shrink-0">
            {product.image && <img src={product.image} className="w-full h-full object-cover" alt={product.name} />}
            <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/70">
                <X size={24} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <h2 className="text-3xl font-bold">{product.name}</h2>
                <p className="text-xl font-medium opacity-90">{formatCurrency(product.price)}</p>
            </div>
        </div>

        {/* Modifiers Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {product.description && (
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
            )}

            {product.modifiers?.map(group => (
                <div key={group.id}>
                    <div className="flex justify-between items-end mb-4 border-b pb-2">
                        <h3 className="text-xl font-bold text-gray-800">{group.name}</h3>
                        <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                            {group.max === 1 ? 'Selecione 1' : `Selecione até ${group.max}`}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {group.options.map(opt => {
                            const isSelected = selectedMods.has(opt.name);
                            return (
                                <button
                                    key={opt.name}
                                    onClick={() => toggleMod(opt.name, group)}
                                    className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
                                        isSelected 
                                        ? 'border-red-600 bg-red-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <Check size={14} strokeWidth={4} />}
                                        </div>
                                        <span className={`text-lg ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{opt.name}</span>
                                    </div>
                                    {opt.price > 0 && (
                                        <span className="text-gray-500">+{formatCurrency(opt.price)}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t bg-gray-50">
            <button 
                onClick={() => onConfirm(product, Array.from(selectedMods))}
                className="w-full bg-red-600 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] transition-transform"
            >
                Adicionar ao Pedido
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Cart Summary Screen ---
export const CartSummary = ({ cart, totals, onBack, onCheckout, onRemove }: any) => (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-6 animate-in slide-in-from-right duration-300">
        <header className="flex items-center mb-8">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 font-bold text-lg px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="mr-2" /> Continuar Comprando
            </button>
            <h1 className="text-3xl font-bold ml-auto">Revisar Pedido</h1>
        </header>

        <div className="flex-1 overflow-y-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            {cart.map((item: CartItem) => (
                <div key={item.cartId} className="flex gap-4 py-6 border-b last:border-0 items-center">
                    <img src={item.image} className="w-24 h-24 rounded-xl object-cover bg-gray-100" alt="" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800">{item.name}</h3>
                        {item.selectedModifiers.length > 0 && (
                            <p className="text-gray-500 mt-1 text-lg">
                                {item.selectedModifiers.join(', ')}
                            </p>
                        )}
                        <p className="text-red-600 font-bold text-lg mt-2">{formatCurrency(item.price)}</p>
                    </div>
                    <button 
                        onClick={() => onRemove(item.cartId)}
                        className="bg-gray-100 p-4 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            ))}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <div className="space-y-3 mb-8 text-xl">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                        <span>Economia</span>
                        <span>-{formatCurrency(totals.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-3xl font-bold text-gray-900 pt-4 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                </div>
            </div>
            
            <button 
                onClick={onCheckout}
                className="w-full bg-green-600 text-white py-6 rounded-2xl text-3xl font-bold shadow-xl shadow-green-200 active:scale-[0.98] transition-transform flex items-center justify-center"
            >
                Pagar Agora
            </button>
        </div>
    </div>
);