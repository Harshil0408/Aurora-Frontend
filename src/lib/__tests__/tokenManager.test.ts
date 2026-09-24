import { tokenManager } from '@/lib/tokenManager';

describe('tokenManager (in-memory only — never persisted)', () => {
  beforeEach(() => {
    tokenManager.clear();
    jest.useRealTimers();
  });

  it('starts empty and expired', () => {
    expect(tokenManager.getToken()).toBeNull();
    expect(tokenManager.isExpired()).toBe(true);
  });

  it('stores and returns a token until expiry', () => {
    tokenManager.setToken('abc', 300);
    expect(tokenManager.getToken()).toBe('abc');
    expect(tokenManager.isExpired()).toBe(false);
  });

  it('treats tokens inside the skew window as expired (safe refresh)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const now = Date.now();
    tokenManager.setToken('abc', 60); // expires in 60s
    // 30s default skew: 40s left -> still valid
    jest.setSystemTime(now + 20_000);
    expect(tokenManager.isExpired()).toBe(false);
    // 1s left -> considered expired so refresh happens early
    jest.setSystemTime(now + 59_000);
    expect(tokenManager.isExpired()).toBe(true);
    // custom skew respected: 3s left with 2s skew -> still valid
    jest.setSystemTime(now + 57_000);
    expect(tokenManager.isExpired(2_000)).toBe(false);
    jest.useRealTimers();
  });

  it('clear() wipes token and forces expired', () => {
    tokenManager.setToken('abc', 300);
    tokenManager.clear();
    expect(tokenManager.getToken()).toBeNull();
    expect(tokenManager.isExpired()).toBe(true);
  });

  it('setToken(null) clears expiry', () => {
    tokenManager.setToken('abc', 300);
    tokenManager.setToken(null);
    expect(tokenManager.getToken()).toBeNull();
    expect(tokenManager.isExpired()).toBe(true);
  });
});
