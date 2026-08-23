import { describe, it, expect } from 'vitest';
import { STORE_PLACEHOLDER } from './index';

describe('store (M0 smoke)', () => {
  it('exposes a placeholder export', () => {
    expect(STORE_PLACEHOLDER).toBe('store');
  });
});
