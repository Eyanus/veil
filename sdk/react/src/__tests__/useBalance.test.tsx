/**
 * Tests for useBalance hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useBalance } from '../hooks/useBalance';
import { VeilContext } from '../context';
import type { InvisibleWallet } from '../../../src/useInvisibleWallet';

const createMockWallet = (overrides: Partial<InvisibleWallet> = {}): InvisibleWallet => {
  return {
    address: 'C123456789',
    isDeployed: true,
    isPending: false,
    error: null,
    register: jest.fn(),
    deploy: jest.fn(),
    signAuthEntry: jest.fn(),
    login: jest.fn(),
    getNonce: jest.fn(),
    addSigner: jest.fn(),
    removeSigner: jest.fn(),
    getSigners: jest.fn(),
    setGuardian: jest.fn(),
    initiateRecovery: jest.fn(),
    completeRecovery: jest.fn(),
    approve: jest.fn(),
    getBalance: jest.fn(),
    sendPayment: jest.fn(),
    getAllowance: jest.fn(),
    outbox: { enqueue: jest.fn(), get: jest.fn(), list: jest.fn(), delete: jest.fn(), clear: jest.fn() } as any,
    replayOutbox: jest.fn(),
    encryptLocal: jest.fn(),
    decryptLocal: jest.fn(),
    encryptionMode: jest.fn(),
    deriveCounterfactualAddress: jest.fn(),
    ...overrides,
  } as unknown as InvisibleWallet;
};

const createWrapper = (wallet: InvisibleWallet) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <VeilContext.Provider value={{ wallet }}>
        {children}
      </VeilContext.Provider>
    </QueryClientProvider>
  );
};

describe('useBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const mockWallet = createMockWallet();
    const { result } = renderHook(
      () => useBalance(),
      { wrapper: createWrapper(mockWallet) },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return balance data on success', async () => {
    const mockBalanceData = {
      address: 'C123456789',
      amount: BigInt(1000),
      assetCode: 'USDC',
    };

    const mockGetBalance = jest.fn().mockResolvedValue(mockBalanceData);
    const mockWallet = createMockWallet({ getBalance: mockGetBalance });

    const { result } = renderHook(
      () => useBalance(),
      { wrapper: createWrapper(mockWallet) },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockBalanceData);
    expect(result.current.error).toBeNull();
    expect(mockGetBalance).toHaveBeenCalled();
  });

  it('should return error state when fetch fails', async () => {
    const mockError = new Error('Failed to fetch balance');
    const mockGetBalance = jest.fn().mockRejectedValue(mockError);
    const mockWallet = createMockWallet({ getBalance: mockGetBalance });

    const { result } = renderHook(
      () => useBalance(),
      { wrapper: createWrapper(mockWallet) },
    );

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    }, { timeout: 3000 });

    expect(result.current.data).toBeUndefined();
    expect(mockGetBalance).toHaveBeenCalled();
  });

  it('should not fetch when wallet address is null', () => {
    const mockGetBalance = jest.fn();
    const mockWallet = createMockWallet({ address: null, getBalance: mockGetBalance });

    const { result } = renderHook(
      () => useBalance(),
      { wrapper: createWrapper(mockWallet) },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetBalance).not.toHaveBeenCalled();
  });
});
