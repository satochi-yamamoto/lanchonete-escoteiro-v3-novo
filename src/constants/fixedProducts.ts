import { Product } from '../types';

// Categoria usada para os lanches do dia fixos no caixa.
export const FIXED_BURGER_CATEGORY = 'Lanches do Dia';

export interface BurgerPlanInput {
  normal: number;
  vegan: number;
  chefe: number;
}

export interface BurgerPlan {
  total: number; // Normal + Vegano
  chefe: number;
  escoteiroExtra: number; // Restante = total - chefe (nunca negativo)
  chefeExceedsTotal: boolean;
}

/**
 * Fonte única das regras de quantidade dos lanches do dia.
 * Usado tanto na validação da abertura quanto no cálculo exibido no PDV,
 * evitando que as duas pontas divirjam.
 */
export const computeBurgerPlan = ({ normal, vegan, chefe }: BurgerPlanInput): BurgerPlan => {
  const safe = (n: number) => (Number.isFinite(n) ? n : 0);
  const total = safe(normal) + safe(vegan);
  const safeChefe = safe(chefe);
  return {
    total,
    chefe: safeChefe,
    escoteiroExtra: Math.max(0, total - safeChefe),
    chefeExceedsTotal: safeChefe > total
  };
};

// IDs estáveis dos lanches fixos do caixa (Chefe / Escoteiro / Extra).
export const FIXED_PRODUCT_IDS = {
  CHEFE: 'shift-lanche-chefe',
  ESCOTEIRO: 'shift-lanche-escoteiro',
  EXTRA: 'shift-lanche-extra'
} as const;

/**
 * Monta os 3 lanches fixos exibidos no caixa a partir do valor unitário
 * informado na abertura:
 * - 00 - Chefe: sempre R$ 0,00
 * - 01 - Escoteiro: valor unitário da abertura
 * - 02 - Extra: valor unitário da abertura
 */
export const buildShiftFixedProducts = (openingUnitCost: number | undefined | null): Product[] => {
  const unit = Number.isFinite(openingUnitCost as number) ? Number(openingUnitCost) : 0;
  const base = {
    category: FIXED_BURGER_CATEGORY,
    station: 'ASSEMBLY' as const,
    is_available: true
  };
  return [
    { id: FIXED_PRODUCT_IDS.CHEFE, name: '00 - Chefe', price: 0, ...base },
    { id: FIXED_PRODUCT_IDS.ESCOTEIRO, name: '01 - Escoteiro', price: unit, ...base },
    { id: FIXED_PRODUCT_IDS.EXTRA, name: '02 - Extra', price: unit, ...base }
  ];
};
