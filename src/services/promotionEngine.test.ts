import { describe, expect, it } from 'vitest';
import { CartItem, Promotion, PromotionType } from '../types';
import { calculateCartTotals } from './promotionEngine';

const makeBurger = (cartId: string, price = 8): CartItem => ({
  id: 'shift-lanche-escoteiro',
  cartId,
  name: '01 - Escoteiro',
  price,
  category: 'Lanches do Dia',
  station: 'ASSEMBLY',
  is_available: true,
  selectedModifiers: []
});

const makeChefe = (cartId: string): CartItem => ({
  id: 'shift-lanche-chefe',
  cartId,
  name: '00 - Chefe',
  price: 0,
  category: 'Lanches do Dia',
  station: 'ASSEMBLY',
  is_available: true,
  selectedModifiers: []
});

describe('promotionEngine', () => {
  it('aplica promoção de quantidade por valor parametrizado', () => {
    const promotion: Promotion = {
      id: 'promo-2-for-10',
      name: '2 lanches por 10',
      type: PromotionType.FIXED_PRICE_BUNDLE,
      rules: {
        category_id: 'Lanches do Dia',
        min_quantity: 2,
        active: true
      },
      value: 10,
      priority: 1
    };

    const totals = calculateCartTotals([
      makeBurger('item-1'),
      makeBurger('item-2'),
      makeBurger('item-3')
    ], [promotion]);

    expect(totals).toEqual({
      subtotal: 24,
      discount: 6,
      total: 18
    });
  });

  it('não aumenta o total quando o valor da promoção é maior que o preço original', () => {
    const promotion: Promotion = {
      id: 'promo-over-price',
      name: '2 lanches por 30',
      type: PromotionType.FIXED_PRICE_BUNDLE,
      rules: {
        category_id: 'Lanches do Dia',
        min_quantity: 2,
        active: true
      },
      value: 30,
      priority: 1
    };

    const totals = calculateCartTotals([
      makeBurger('item-1'),
      makeBurger('item-2')
    ], [promotion]);

    expect(totals).toEqual({
      subtotal: 16,
      discount: 0,
      total: 16
    });
  });

  it('ignora lanches gratuitos ao formar combos de promoção', () => {
    const promotion: Promotion = {
      id: 'promo-paid-burgers',
      name: '2 lanches pagos por 10',
      type: PromotionType.FIXED_PRICE_BUNDLE,
      rules: {
        category_id: 'Lanches do Dia',
        min_quantity: 2,
        active: true
      },
      value: 10,
      priority: 1
    };

    const totals = calculateCartTotals([
      makeChefe('chefe-1'),
      makeBurger('item-1'),
      makeBurger('item-2')
    ], [promotion]);

    expect(totals).toEqual({
      subtotal: 16,
      discount: 6,
      total: 10
    });
  });
});
