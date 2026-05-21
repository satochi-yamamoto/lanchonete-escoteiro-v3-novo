import { beforeEach, describe, expect, it } from 'vitest';
import { calculateOpeningUnitCost, isOpeningShiftInputValid } from './apps/POS';
import { useStore } from './store';
import { OrderStatus, OrderType, PaymentMethod } from './types';

describe('Reestruturação inicial do POS', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
  });

  it('calcula o valor unitário sugerido pela quantidade total de lanches', () => {
    expect(calculateOpeningUnitCost(500, 80, 20)).toBe(5);
    expect(calculateOpeningUnitCost(500, 0, 0)).toBe(0);
  });

  it('bloqueia dados de abertura sem quantidade planejada', () => {
    expect(isOpeningShiftInputValid({
      startCash: 150,
      operatorName: 'Caixa 01',
      terminalId: 'Grupo A',
      dailyMenuName: 'Lanche do Dia',
      totalCost: 500,
      normalQty: 0,
      veganQty: 0,
      finalUnitCost: 5
    })).toBe(false);
  });

  it('salva os novos campos de abertura no turno atual', () => {
    useStore.setState({
      currentSession: {
        id: 'session-1',
        opened_at: new Date().toISOString(),
        status: 'OPEN',
        opened_by: 'Admin'
      }
    });

    useStore.getState().openShift('Operador', 150, 'Grupo A', {
      opening_product_cost_total: 500,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });

    expect(useStore.getState().currentShift).toMatchObject({
      staff_name: 'Operador',
      terminal_id: 'Grupo A',
      opening_product_cost_total: 500,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });
  });

  it('cria pedidos como entregues automaticamente', () => {
    const product = useStore.getState().products[0];

    useStore.getState().addToCart(product);
    useStore.getState().createOrder(OrderType.DINE_IN, PaymentMethod.PIX, 'Cliente Balcão');

    const order = useStore.getState().orders.at(-1);

    expect(order).toMatchObject({
      status: OrderStatus.DELIVERED,
      payment_method: PaymentMethod.PIX
    });
    expect(order?.paid_at).toBeDefined();
    expect(order?.delivered_at).toBeDefined();
  });
});
