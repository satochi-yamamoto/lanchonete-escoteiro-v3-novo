import { CartItem, Promotion, PromotionType } from '../types';
// Note: MOCK_PROMOTIONS is now imported from mockData but is kept empty to prevent auto-seeding
import { MOCK_PROMOTIONS } from './mockData';

export const calculateCartTotals = (items: CartItem[], promotions: Promotion[]) => {
  let subtotal = items.reduce((sum, item) => sum + item.price, 0);
  let discountAmount = 0;

  // Clone items to track which have been "used" by a promotion
  const availableItems = [...items];
  const usedItemIds = new Set<string>();

  // Sort promotions by priority and filter out inactive ones
  const sortedPromos = [...promotions]
    .filter(p => p.rules?.active !== false) // Treat undefined as true
    .sort((a, b) => b.priority - a.priority);

  for (const promo of sortedPromos) {
    if (promo.type === PromotionType.FIXED_PRICE_BUNDLE) {
      // Example: 2 Burgers for $15
      // Filter items matching the rule (e.g., Category = Burgers)
      const eligibleItems = availableItems.filter(item => 
        !usedItemIds.has(item.cartId) && 
        (promo.rules.category_id ? item.category === promo.rules.category_id : true) &&
        (promo.rules.product_id ? item.id === promo.rules.product_id : true)
      );

      // How many bundles can we make?
      // Pega todos os itens elegíveis e soma suas quantidades (um item pode ter quantity > 1 no carrinho real, mas aqui availableItems pode estar achatado. Se estiver achatado, o length é a quantidade total).
      // Como o motor clona o carrinho e mantém a estrutura de CartItem, e sabemos que o addToCart do store às vezes aumenta a quantidade no mesmo item, precisamos considerar isso.
      // O motor atual assume que `items` está expandido (1 item por unidade) ou conta a length? 
      // Olhando o código acima `eligibleItems.length`, ele contava os objetos distintos. Vamos mudar para somar as quantidades.
      const totalEligibleQuantity = eligibleItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const bundleCount = Math.floor(totalEligibleQuantity / promo.rules.min_quantity);

      if (bundleCount > 0) {
        // Expand eligible items based on quantity so we can pick exactly what we need
        const expandedEligible: CartItem[] = [];
        eligibleItems.forEach(item => {
            const qty = item.quantity || 1;
            for(let i = 0; i < qty; i++) {
                expandedEligible.push({...item, quantity: 1}); // Create single-unit clones
            }
        });

        for (let i = 0; i < bundleCount; i++) {
          // Pegar os itens que formam este bundle
          const itemsInBundle = expandedEligible.slice(i * promo.rules.min_quantity, (i + 1) * promo.rules.min_quantity);
          
          // Marcar os IDs como usados (como estamos clonando, usamos o cartId original)
          itemsInBundle.forEach(item => usedItemIds.add(item.cartId));

          // Calcular o desconto deste bundle
          const originalBundlePrice = itemsInBundle.reduce((sum, item) => sum + item.price, 0);
          discountAmount += (originalBundlePrice - promo.value);
        }
      }
    }
  }

  // Basic implementation of simple discounts could go here for remaining items

  return {
    subtotal,
    discount: discountAmount,
    total: Math.max(0, subtotal - discountAmount)
  };
};

export { MOCK_PROMOTIONS };