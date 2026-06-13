// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CashPaymentModal } from './PosComponents';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('CashPaymentModal', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it('calcula o troco e só confirma quando o valor recebido cobre o total', () => {
        const onConfirm = vi.fn();

        act(() => {
            root.render(
                <CashPaymentModal
                    total={8}
                    onCancel={vi.fn()}
                    onConfirm={onConfirm}
                />
            );
        });

        const input = container.querySelector<HTMLInputElement>('[data-testid="cash-received"]')!;
        const confirmButton = container.querySelector<HTMLButtonElement>('[data-testid="confirm-cash-payment"]')!;
        const setInputValue = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value'
        )?.set;

        // Campo vazio é permitido: assume o valor total a pagar
        expect(confirmButton.disabled).toBe(false);

        act(() => {
            setInputValue?.call(input, '5,00');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(container.textContent).toContain('Faltam');
        expect(container.textContent).toContain('3,00');
        expect(confirmButton.disabled).toBe(true);

        act(() => {
            setInputValue?.call(input, '20,00');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(container.querySelector('[data-testid="cash-change"]')?.textContent).toContain('12,00');
        expect(confirmButton.disabled).toBe(false);

        act(() => {
            confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(onConfirm).toHaveBeenCalledWith(20);
    });

    it('assume o valor total a pagar quando o campo fica vazio', () => {
        const onConfirm = vi.fn();

        act(() => {
            root.render(
                <CashPaymentModal
                    total={8}
                    onCancel={vi.fn()}
                    onConfirm={onConfirm}
                />
            );
        });

        const confirmButton = container.querySelector<HTMLButtonElement>('[data-testid="confirm-cash-payment"]')!;

        expect(confirmButton.disabled).toBe(false);

        act(() => {
            confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(onConfirm).toHaveBeenCalledWith(8);
    });
});
