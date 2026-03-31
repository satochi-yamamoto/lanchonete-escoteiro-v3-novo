import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { OrderType, Product, PaymentMethod } from '../types';
import { formatCurrency } from '../components/ui';
import { Splash, CategoryNav, KioskProductCard, ProductCustomizer, CartSummary } from '../components/kiosk/KioskComponents';
import { PaymentModal } from '../components/pos/PosComponents';
import { ShoppingBag, CreditCard } from 'lucide-react';
import { printReceipt } from '../utils';

type KioskStep = 'SPLASH' | 'MENU' | 'CUSTOMIZE' | 'CART' | 'PAYMENT' | 'SUCCESS';

export const Kiosk = () => {
  const { 
    currentSession,
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    cartTotals, 
    clearCart,
    createOrder,
    maxItemsPerOrder,
    activePaymentMethodsKiosk,
    printReceiptEnabled
  } = useStore();

  const [step, setStep] = useState<KioskStep>('SPLASH');
  const [activeCategory, setActiveCategory] = useState('Lanches');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  
  // Idle Timer Logic
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_LIMIT_MS = 60000; // 60 seconds

  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (step !== 'SPLASH') {
        idleTimeoutRef.current = setTimeout(() => {
            resetKiosk();
        }, IDLE_LIMIT_MS);
    }
  };

  const resetKiosk = () => {
    setStep('SPLASH');
    clearCart();
    setSelectedProduct(null);
    setLastOrder(null);
  };

  useEffect(() => {
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    return () => {
        window.removeEventListener('click', resetIdleTimer);
        window.removeEventListener('touchstart', resetIdleTimer);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [step]);

  // Derived Data
  const categories = Array.from(new Set(products.filter(p => p.is_available).map(p => p.category)));
  const availableProducts = products.filter(p => p.is_available && p.category === activeCategory);

  // Handlers
  const handleProductClick = (p: Product) => {
    setSelectedProduct(p);
  };

  const handleAddToCart = (product: Product, modifiers: string[]) => {
    if (cart.length >= maxItemsPerOrder) {
        // Simple alert for now, can be improved with a custom modal later
        alert(`O pedido está limitado a ${maxItemsPerOrder} itens.`);
        return;
    }
    addToCart(product, modifiers);
    setSelectedProduct(null);
  };

  const handlePayment = () => {
    setStep('PAYMENT');
  };

  const handlePaymentConfirm = (method: PaymentMethod, amount: number, customId: string) => {
      createOrder(OrderType.KIOSK, method, customId || 'QUIOSQUE');
      
      const currentOrders = useStore.getState().orders;
      const newOrder = currentOrders[currentOrders.length - 1];
      
      setLastOrder(newOrder);
      if (printReceiptEnabled) {
          printReceipt(newOrder);
      }

      setStep('SUCCESS');
      
      // Auto reset after success
      setTimeout(() => {
          resetKiosk();
      }, 7000);
  };

  // --- Render Views ---

  if (step === 'SPLASH') {
    if (!currentSession) {
        return (
            <div className="h-screen bg-red-600 text-white flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white/20 p-8 rounded-full mb-6">
                    <ShoppingBag size={64} className="opacity-50" />
                </div>
                <h1 className="text-4xl font-bold mb-4">LOJA FECHADA</h1>
                <p className="text-xl opacity-80">Nosso autoatendimento não está disponível no momento.</p>
                <p className="mt-8 text-sm opacity-50 border-t border-white/20 pt-4">Aguarde a abertura da loja pelo gerente.</p>
            </div>
        );
    }
    return <Splash onStart={() => setStep('MENU')} />;
  }

  if (step === 'SUCCESS') {
    return (
        <div className="h-screen bg-green-600 text-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
            <div className="bg-white text-green-600 w-32 h-32 rounded-full flex items-center justify-center text-6xl mb-8 shadow-xl">
                ✓
            </div>
            <h1 className="text-6xl font-bold mb-4">Pedido Confirmado!</h1>
            <p className="text-3xl opacity-90 mb-12">Por favor, retire sua senha.</p>
            <div className="bg-white/20 px-12 py-8 rounded-3xl backdrop-blur-sm">
                <p className="text-xl uppercase font-bold tracking-widest opacity-80 mb-2">Sua Senha</p>
                <p className="text-8xl font-mono font-bold">#{lastOrder?.order_number || '000'}</p>
            </div>
        </div>
    );
  }



  // Common Layout for Menu and Cart
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white px-8 py-6 shadow-sm flex justify-between items-center z-20 shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold text-red-600 tracking-tighter cursor-pointer" onClick={() => setStep('SPLASH')}>Lanchonete Escoteiros Cooper</h1>
        {step === 'MENU' && cart.length > 0 && (
            <button 
                onClick={() => setStep('CART')}
                className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center gap-3"
            >
                <ShoppingBag />
                <span>Ver Pedido • {formatCurrency(cartTotals.total)}</span>
            </button>
        )}
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden relative">
        
        {step === 'MENU' && (
            <div className="h-full flex flex-col">
                <CategoryNav 
                    categories={categories} 
                    active={activeCategory} 
                    onSelect={setActiveCategory} 
                />
                
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {availableProducts.map(p => (
                            <div key={p.id} className="h-96">
                                <KioskProductCard 
                                    product={p} 
                                    onClick={() => handleProductClick(p)} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {(step === 'CART' || step === 'PAYMENT') && (
            <CartSummary 
                cart={cart}
                totals={cartTotals}
                onBack={() => setStep('MENU')}
                onCheckout={() => setStep('PAYMENT')}
                onRemove={removeFromCart}
            />
        )}

      </div>

      {/* Modals */}
      {selectedProduct && (
          <ProductCustomizer 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onConfirm={handleAddToCart}
          />
      )}

      {step === 'PAYMENT' && (
          <PaymentModal 
            total={cartTotals.total} 
            activeMethods={activePaymentMethodsKiosk}
            isKiosk={true}
            onCancel={() => setStep('CART')} 
            onConfirm={handlePaymentConfirm} 
          />
      )}
    </div>
  );
};