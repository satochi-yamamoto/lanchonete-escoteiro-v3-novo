# Bug Investigation: Kiosk Product Modal Not Opening

## 📋 Status
❓ **Pending Investigation** - Modal não abre quando produto é clicado no Kiosk

## 🔍 Analysis

### Current Implementation
The code structure appears correct:

1. **Product Click Handler** ([Kiosk.tsx](src/apps/Kiosk.tsx#L65-L67)):
   ```tsx
   const handleProductClick = (p: Product) => {
     setSelectedProduct(p);
   };
   ```

2. **Modal Rendering** ([Kiosk.tsx](src/apps/Kiosk.tsx#L187-L193)):
   ```tsx
   {selectedProduct && (
     <ProductCustomizer 
       product={selectedProduct} 
       onClose={() => setSelectedProduct(null)} 
       onConfirm={handleAddToCart}
     />
   )}
   ```

3. **Product Card Click** ([Kiosk.tsx](src/apps/Kiosk.tsx#L159-L164)):
   ```tsx
   <KioskProductCard 
     product={p} 
     onClick={() => handleProductClick(p)} 
   />
   ```

### Possible Root Causes

#### 1. **Product Availability Filter**
Products marked as `is_available = false` are filtered out:
```tsx
const availableProducts = products.filter(p => p.is_available && p.category === activeCategory);
```

**Test:** Check if clicked products have `is_available: true` in database/mock data.

#### 2. **Z-Index Conflict**
ProductCustomizer has `z-50`, but there might be a parent with `isolation: isolate` or competing z-index.

**Test:** Inspect with DevTools to verify modal is actually rendered in DOM.

#### 3. **Modal State Reset**
The idle timer might be interfering with state:
```tsx
const resetIdleTimer = () => {
  if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
  if (step !== 'SPLASH') {
    idleTimeoutRef.current = setTimeout(() => {
      resetKiosk(); // Clears selectedProduct
    }, IDLE_LIMIT_MS);
  }
};
```

**Test:** Temporarily disable idle timer and test modal.

#### 4. **React Event Handler Conflict**
Multiple event listeners might be preventing click propagation:
- `window.addEventListener('click', resetIdleTimer)`
- `window.addEventListener('touchstart', resetIdleTimer)`

**Test:** Check if `stopPropagation()` is needed in product click handler.

#### 5. **Product Modifiers Missing**
The modal heavily relies on `product.modifiers`:
```tsx
{product.modifiers?.map(group => ...)}
```

If `modifiers` is empty/undefined, modal might appear blank or not render properly.

**Test:** Check if products have `modifiers` array defined.

## 🛠️ Debugging Steps

### Step 1: Add Console Logs
```tsx
const handleProductClick = (p: Product) => {
  console.log('[Kiosk] Product clicked:', p.name);
  console.log('[Kiosk] Product data:', JSON.stringify(p, null, 2));
  setSelectedProduct(p);
};
```

### Step 2: Verify Modal Rendering
```tsx
{selectedProduct && (
  <>
    <div className="fixed top-0 left-0 bg-blue-500 text-white z-[100] p-4">
      DEBUG: Modal should appear. Product: {selectedProduct.name}
    </div>
    <ProductCustomizer 
      product={selectedProduct} 
      onClose={() => {
        console.log('[Kiosk] Modal closed');
        setSelectedProduct(null);
      }} 
      onConfirm={handleAddToCart}
    />
  </>
)}
```

### Step 3: Check Product Data
```tsx
// In KioskProductCard
export const KioskProductCard = ({ product, onClick }: { product: Product, onClick: () => void }) => {
  const handleClick = () => {
    console.log('[KioskProductCard] Clicked:', product.name);
    console.log('[KioskProductCard] Available:', product.is_available);
    console.log('[KioskProductCard] Has modifiers:', !!product.modifiers);
    onClick();
  };
  
  return (
    <div 
      onClick={handleClick} // Changed from onClick={onClick}
      className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all flex flex-col items-center text-center h-full justify-between"
    >
      {/* ... rest of component */}
    </div>
  );
};
```

### Step 4: Verify Modal CSS
Check if modal container has proper stacking context:
```tsx
// Add to ProductCustomizer
<div 
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4"
  style={{ isolation: 'isolate' }}
>
```

## 🧪 Test Scenarios

### Manual Testing
1. Open Kiosk module (`?mode=kiosk` or through menu)
2. Click on a product card
3. **Expected:** ProductCustomizer modal appears with product details
4. **Actual:** ?

### Browser Console Checks
```javascript
// Check if products have modifiers
useStore.getState().products.forEach(p => {
  console.log(p.name, 'has modifiers:', !!p.modifiers, p.modifiers?.length || 0);
});

// Check current product selection state
console.log('Selected product:', useStore.getState().selectedProduct);
```

## 🔧 Proposed Quick Fixes

### Fix #1: Force Modal Render (Debug Only)
```tsx
// Temporarily hardcode to always show modal for testing
const [debugModal, setDebugModal] = useState(false);

// Add button in header
<button onClick={() => setDebugModal(true)}>Test Modal</button>

// Render modal
{(selectedProduct || debugModal) && (
  <ProductCustomizer 
    product={selectedProduct || products[0]} 
    onClose={() => { setSelectedProduct(null); setDebugModal(false); }} 
    onConfirm={handleAddToCart}
  />
)}
```

### Fix #2: Add Click Visualization
```tsx
const [clickedPos, setClickedPos] = useState<{x: number, y: number} | null>(null);

const handleProductClick = (p: Product, e: React.MouseEvent) => {
  setClickedPos({ x: e.clientX, y: e.clientY });
  setTimeout(() => setClickedPos(null), 1000);
  setSelectedProduct(p);
};

{clickedPos && (
  <div 
    className="fixed w-20 h-20 bg-red-500 rounded-full animate-ping pointer-events-none z-[9999]"
    style={{ left: clickedPos.x - 40, top: clickedPos.y - 40 }}
  />
)}
```

### Fix #3: Prevent Event Interference
```tsx
const handleProductClick = (p: Product) => {
  // Stop event propagation to prevent idle timer reset conflicts
  window.removeEventListener('click', resetIdleTimer);
  setSelectedProduct(p);
  
  // Re-add listener after modal opens
  setTimeout(() => {
    window.addEventListener('click', resetIdleTimer);
  }, 100);
};
```

### Fix #4: Ensure Product Data Integrity
```tsx
const handleProductClick = (p: Product) => {
  // Ensure product has modifiers array (even if empty)
  const normalizedProduct = {
    ...p,
    modifiers: p.modifiers || []
  };
  setSelectedProduct(normalizedProduct);
};
```

## 📝 Next Steps

1. ✅ Document investigation (this file)
2. ⏳ Add debug console logs to product click chain
3. ⏳ Verify modal appears in React DevTools component tree
4. ⏳ Check browser console for React warnings/errors
5. ⏳ Test with simplified modal (remove animations and complex styling)
6. ⏳ Confirm products have proper `modifiers` structure
7. ⏳ Test in different browsers (Chrome, Firefox, Safari)
8. ⏳ Record test video for TestSprite failure analysis

## 🔗 Related Files
- [src/apps/Kiosk.tsx](src/apps/Kiosk.tsx) - Main Kiosk component
- [src/components/kiosk/KioskComponents.tsx](src/components/kiosk/KioskComponents.tsx) - ProductCustomizer modal
- [src/services/mockData.ts](src/services/mockData.ts) - Product mock data
- [ACOES_CORRETIVAS_TESTSPRITE.md](ACOES_CORRETIVAS_TESTSPRITE.md) - Original issue report (High Priority #7)

## 📊 Priority
**High** - Affects user experience in Kiosk module, blocking 3 TestSprite tests (TC030, TC031, TC032)

## ⏱️ Estimated Effort
3-4 hours (investigation + fix + testing)
