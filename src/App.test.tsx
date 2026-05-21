// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useStore } from './store';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('./components/LoginScreen', () => ({
  LoginScreen: ({ onLogin }: { onLogin: (user: { id: string; name: string; role: 'ADMIN' }) => void }) => (
    <button onClick={() => onLogin({ id: 'u1', name: 'Admin', role: 'ADMIN' })}>
      Entrar como Admin
    </button>
  )
}));

describe('Menu principal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useStore.setState(useStore.getInitialState(), true);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('exibe somente Terminal PDV e Admin Backoffice', () => {
    act(() => {
      root.render(<App />);
    });

    const loginButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Entrar como Admin'
    );

    expect(loginButton).toBeDefined();

    act(() => {
      loginButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Terminal PDV');
    expect(container.textContent).toContain('Admin Backoffice');
    expect(container.textContent).not.toContain('Totem Autoatendimento');
    expect(container.textContent).not.toContain('KDS (Completo)');
    expect(container.textContent).not.toContain('KDS (Simplificado)');
    expect(container.textContent).not.toContain('Status TV');
  });
});
