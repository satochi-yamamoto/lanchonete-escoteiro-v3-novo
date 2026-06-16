import { beforeEach, describe, expect, it } from 'vitest';
import { calculateOpeningUnitCost, getOpeningCostReimbursements, isOpeningShiftInputValid } from './apps/POS';
import { buildShiftFixedProducts, computeBurgerPlan, FIXED_PRODUCT_IDS } from './constants/fixedProducts';
import { useStore } from './store';
import { OrderStatus, OrderType, PaymentMethod } from './types';

describe('Reestruturação inicial do POS', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
  });

  it('calcula o valor unitário sugerido pela quantidade de lanches pagantes (Escoteiros/Extra)', () => {
    // 500 custo / 90 pagantes (100 total - 10 chefes) = 5,5556
    expect(calculateOpeningUnitCost(500, 90)).toBeCloseTo(5.5556, 4);
    expect(calculateOpeningUnitCost(450, 90)).toBe(5);
    expect(calculateOpeningUnitCost(500, 0)).toBe(0);
  });

  it('bloqueia dados de abertura sem quantidade planejada', () => {
    expect(isOpeningShiftInputValid({
      startCash: 150,
      operatorName: 'Caixa 01',
      terminalId: 'Grupo A',
      dailyMenuName: 'Lanche do Dia',
      totalCost: 500,
      drinksLiters: 20,
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
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });

    expect(useStore.getState().currentShift).toMatchObject({
      staff_name: 'Operador',
      terminal_id: 'Grupo A',
      opening_product_cost_total: 500,
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });
  });

  it('prepara somente valores válidos do detalhamento para registrar reembolsos', () => {
    expect(getOpeningCostReimbursements([
      { id: '1', reimbursedName: ' Ana Souza ', amount: '120.50' },
      { id: '2', reimbursedName: 'Linha vazia', amount: '' },
      { id: '3', reimbursedName: 'Valor zero', amount: '0' },
      { id: '4', reimbursedName: '', amount: '79.50' }
    ])).toEqual([
      { payee: 'Ana Souza', amount: 120.50 },
      { payee: '', amount: 79.50 }
    ]);
  });

  it('registra reembolsos de abertura em lote sem perder o ultimo lancamento', async () => {
    useStore.setState({
      currentSession: {
        id: 'session-1',
        opened_at: new Date().toISOString(),
        status: 'OPEN',
        opened_by: 'Admin'
      }
    });

    await useStore.getState().openShift('Operador', 360, 'Grupo A', {
      opening_product_cost_total: 1185,
      opening_drinks_liters: 30,
      planned_normal_burgers: 250,
      planned_vegan_burgers: 35,
      planned_chefe_burgers: 0,
      planned_escoteiro_extra_burgers: 285,
      opening_unit_cost_suggested: 4.16,
      opening_unit_cost: 5,
      daily_menu_name: 'Lanche Escoteiro'
    });

    await useStore.getState().addShiftTransactions([
      { type: 'REIMBURSEMENT', amount: 250, reason: 'Reembolso Abertura', extras: { payee: 'aaaa' } },
      { type: 'REIMBURSEMENT', amount: 300, reason: 'Reembolso Abertura', extras: { payee: 'dadadas' } },
      { type: 'REIMBURSEMENT', amount: 500, reason: 'Reembolso Abertura', extras: { payee: 'dasdsad' } },
      { type: 'REIMBURSEMENT', amount: 85, reason: 'Reembolso Abertura', extras: { payee: 'daddddda' } },
      { type: 'REIMBURSEMENT', amount: 20, reason: 'Reembolso Abertura', extras: { payee: 'aas' } },
      { type: 'REIMBURSEMENT', amount: 30, reason: 'Reembolso Abertura', extras: { payee: 'ultimo' } }
    ]);

    const reimbursements = useStore.getState().currentShift?.transactions.filter((transaction) => transaction.type === 'REIMBURSEMENT') ?? [];

    expect(reimbursements).toHaveLength(6);
    expect(reimbursements.reduce((total, transaction) => total + transaction.amount, 0)).toBe(1185);
    expect(reimbursements.at(-1)).toMatchObject({ amount: 30, payee: 'ultimo' });
    expect(useStore.getState().currentShift?.current_cash).toBe(-825);
  });

  it('bloqueia abertura quando os lanches de Chefes excedem o total planejado', () => {
    const base = {
      startCash: 150,
      operatorName: 'Caixa 01',
      terminalId: 'Grupo A',
      dailyMenuName: 'Lanche do Dia',
      totalCost: 500,
      drinksLiters: 20,
      normalQty: 80,
      veganQty: 20,
      finalUnitCost: 5
    };
    expect(isOpeningShiftInputValid({ ...base, chefeQty: 100 })).toBe(true);
    expect(isOpeningShiftInputValid({ ...base, chefeQty: 101 })).toBe(false);
    expect(isOpeningShiftInputValid({ ...base, chefeQty: -1 })).toBe(false);
    // chefeQty é opcional e assume 0
    expect(isOpeningShiftInputValid(base)).toBe(true);
  });

  it('centraliza o plano de lanches (total, chefe e escoteiro/extra)', () => {
    expect(computeBurgerPlan({ normal: 80, vegan: 20, chefe: 10 })).toEqual({
      total: 100,
      chefe: 10,
      escoteiroExtra: 90,
      chefeExceedsTotal: false
    });
    // Chefe acima do total: escoteiro/extra nunca fica negativo e sinaliza excesso
    expect(computeBurgerPlan({ normal: 10, vegan: 0, chefe: 15 })).toEqual({
      total: 10,
      chefe: 15,
      escoteiroExtra: 0,
      chefeExceedsTotal: true
    });
    // Valores não-finitos são tratados como 0
    expect(computeBurgerPlan({ normal: NaN, vegan: 5, chefe: NaN })).toEqual({
      total: 5,
      chefe: 0,
      escoteiroExtra: 5,
      chefeExceedsTotal: false
    });
  });

  it('monta os lanches fixos do caixa com preços derivados da abertura', () => {
    const [chefe, escoteiro, extra] = buildShiftFixedProducts(6);
    expect(chefe).toMatchObject({ name: '00 - Chefe', price: 0 });
    expect(escoteiro).toMatchObject({ name: '01 - Escoteiro', price: 6 });
    expect(extra).toMatchObject({ name: '02 - Extra', price: 6 });
    // Sem valor de abertura, Escoteiro/Extra ficam zerados (Chefe sempre 0)
    expect(buildShiftFixedProducts(undefined).map((p) => p.price)).toEqual([0, 0, 0]);

    const withVegan = buildShiftFixedProducts(6, { includeVegan: true });
    expect(withVegan.map((p) => p.name)).toEqual(['00 - Chefe', '01 - Escoteiro', '02 - Extra', '03 - Vegano']);
    expect(withVegan.at(-1)).toMatchObject({ id: FIXED_PRODUCT_IDS.VEGANO, price: 6 });
  });

  it('permite corrigir o valor dos lanches fixos pagantes durante o caixa aberto', () => {
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
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 5,
      daily_menu_name: 'Lanche Escoteiro'
    });

    useStore.getState().updateShiftFixedProductPrice(FIXED_PRODUCT_IDS.ESCOTEIRO, 8);

    expect(useStore.getState().currentShift?.opening_unit_cost).toBe(8);
    expect(buildShiftFixedProducts(useStore.getState().currentShift?.opening_unit_cost, { includeVegan: true }).map((p) => p.price)).toEqual([0, 8, 8, 8]);

    useStore.getState().updateShiftFixedProductPrice(FIXED_PRODUCT_IDS.VEGANO, 9);

    expect(useStore.getState().currentShift?.opening_unit_cost).toBe(9);

    useStore.getState().updateShiftFixedProductPrice(FIXED_PRODUCT_IDS.CHEFE, 10);

    expect(useStore.getState().currentShift?.opening_unit_cost).toBe(9);
  });

  it('permite ajustar dados da abertura mantendo o caixa teorico consistente', async () => {
    useStore.setState({
      currentSession: {
        id: 'session-1',
        opened_at: new Date().toISOString(),
        status: 'OPEN',
        opened_by: 'Admin'
      }
    });

    await useStore.getState().openShift('Operador', 150, 'Grupo A', {
      opening_product_cost_total: 500,
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 5,
      daily_menu_name: 'Lanche Escoteiro'
    });

    useStore.getState().addShiftTransaction('SALE', 25, 'Venda teste');

    await useStore.getState().updateShiftOpeningData({
      staff_name: 'Operador Ajustado',
      terminal_id: 'Grupo B',
      start_cash: 200,
      opening_product_cost_total: 600,
      opening_drinks_liters: 25,
      planned_normal_burgers: 90,
      planned_vegan_burgers: 10,
      planned_chefe_burgers: 5,
      planned_escoteiro_extra_burgers: 95,
      opening_unit_cost_suggested: 6.32,
      opening_unit_cost: 6.5,
      daily_menu_name: 'Lanche Ajustado'
    });

    expect(useStore.getState().currentShift).toMatchObject({
      staff_name: 'Operador Ajustado',
      terminal_id: 'Grupo B',
      start_cash: 200,
      current_cash: 225,
      opening_product_cost_total: 600,
      opening_drinks_liters: 25,
      planned_normal_burgers: 90,
      planned_vegan_burgers: 10,
      planned_chefe_burgers: 5,
      planned_escoteiro_extra_burgers: 95,
      opening_unit_cost_suggested: 6.32,
      opening_unit_cost: 6.5,
      daily_menu_name: 'Lanche Ajustado'
    });
    expect(useStore.getState().currentShift?.transactions[0]).toMatchObject({
      type: 'OPENING',
      amount: 200,
      user_id: 'Operador Ajustado'
    });
  });

  it('registra histórico de ajustes quando o fechamento difere da abertura', () => {
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
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });

    // Cardápio, custo e bebida mudam; total produzido permanece igual ao planejado (100)
    useStore.getState().closeShift({
      menu_name: 'Lanche Vegano',
      burger_cost: 7.5,
      drinks_liters: 25,
      burgers_produced: 100,
      closer_name: 'Fechador'
    });

    const adjustments = useStore.getState().currentShift?.adjustments ?? [];
    const byField = Object.fromEntries(adjustments.map((a) => [a.field, a]));

    expect(adjustments).toHaveLength(3);
    expect(byField.menu_name).toMatchObject({
      previous_value: 'Lanche Escoteiro',
      new_value: 'Lanche Vegano',
      changed_by: 'Fechador'
    });
    expect(byField.burger_cost).toMatchObject({ previous_value: 6, new_value: 7.5 });
    expect(byField.drinks_liters).toMatchObject({ previous_value: 20, new_value: 25 });
    expect(byField.burgers_produced).toBeUndefined();
  });

  it('mantém caixas abertos e fechados no histórico local para relatórios', () => {
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
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });

    const firstShiftId = useStore.getState().currentShift?.id;

    expect(useStore.getState().reportShifts).toHaveLength(1);
    expect(useStore.getState().reportShifts[0]).toMatchObject({
      id: firstShiftId,
      status: 'OPEN',
      staff_name: 'Operador'
    });

    useStore.getState().closeShift({
      menu_name: 'Lanche Escoteiro',
      burger_cost: 6,
      burgers_produced: 100
    });

    expect(useStore.getState().reportShifts[0]).toMatchObject({
      id: firstShiftId,
      status: 'CLOSED'
    });
    expect(useStore.getState().reportShifts[0].closed_at).toBeDefined();

    useStore.getState().openShift('Operador 2', 200, 'Grupo B', {
      opening_product_cost_total: 300,
      opening_drinks_liters: 15,
      planned_normal_burgers: 40,
      planned_vegan_burgers: 10,
      planned_chefe_burgers: 5,
      planned_escoteiro_extra_burgers: 45,
      opening_unit_cost_suggested: 6,
      opening_unit_cost: 7,
      daily_menu_name: 'Lanche Especial'
    });

    expect(useStore.getState().reportShifts).toHaveLength(2);
    expect(useStore.getState().reportShifts.map((shift) => shift.id)).toContain(firstShiftId);
  });

  it('não registra ajuste quando o fechamento repete os dados da abertura', () => {
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
      opening_drinks_liters: 20,
      planned_normal_burgers: 80,
      planned_vegan_burgers: 20,
      planned_chefe_burgers: 10,
      planned_escoteiro_extra_burgers: 90,
      opening_unit_cost_suggested: 5,
      opening_unit_cost: 6,
      daily_menu_name: 'Lanche Escoteiro'
    });

    useStore.getState().closeShift({
      menu_name: 'Lanche Escoteiro',
      burger_cost: 6,
      burgers_produced: 100
    });

    expect(useStore.getState().currentShift?.adjustments ?? []).toHaveLength(0);
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

  it('mantém somente PIX e dinheiro como meios operacionais', () => {
    expect(useStore.getState().activePaymentMethodsPOS).toEqual([
      PaymentMethod.PIX,
      PaymentMethod.CASH
    ]);
    expect(useStore.getState().activePaymentMethodsKiosk).toEqual([
      PaymentMethod.PIX,
      PaymentMethod.CASH
    ]);
  });
});
