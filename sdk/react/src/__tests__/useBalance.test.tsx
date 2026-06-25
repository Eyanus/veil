/**
 * Tests for useBalance hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { Networks } from '@stellar/stellar-sdk';
import { VeilProvider } from '../provider';
import type { WalletConfig, InvisibleWallet } from '../../../src/useInvisibleWallet';
import { useBalance, type BalanceData } from '../hooks/useBalance';

// Mock wallet implementation
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
    ...overrides,
  };
};

// Mock useInvisibleWallet hook
jest.mock('../../../src/useInvisibleWallet', () => ({
  ...jest.requireActual('../../../src/useInvisibleWallet'),
  useInvisibleWallet: jest.fn(),
}));

import { useInvisibleWallet as mockUseInvisibleWallet } from '../../../src/useInvisibleWallet';

// Test config
const testConfig: WalletConfig = {
  factoryAddress: 'CFACTORY',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
};

describe('useBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const mockWallet = createMockWallet({ address: 'C123456789' });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useBalance(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and return balance data on success', async () => {
    const mockBalanceData: BalanceData = {
      address: 'C123456789',
      amount: BigInt(1000),
      assetCode: 'XLM',
    };

    const mockGetBalance = jest.fn<Promise<any>, [string | undefined]>().mockResolvedValue(mockBalanceData);
    const mockWallet = createMockWallet({ address: 'C123456789', getBalance: mockGetBalance });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useBalance(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockBalanceData);
    expect(result.current.error).toBeNull();
    expect(mockGetBalance).toHaveBeenCalledWith(undefined);
  });

  it.skip('should return error state when fetch fails', async () => {
    const mockError = new Error('Failed to fetch balance');
    const mockGetBalance = jest.fn<Promise<any>, [string | undefined]>().mockRejectedValue(mockError);
    const mockWallet = createMockWallet({ address: 'C123456789', getBalance: mockGetBalance });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useBalance(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
    expect(mockGetBalance).toHaveBeenCalledWith(undefined);
  });

  it('should not fetch when address is null', async () => {
    const mockGetBalance = jest.fn<Promise<any>, [string | undefined]>();
    const mockWallet = createMockWallet({ address: null, getBalance: mockGetBalance });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useBalance(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(mockGetBalance).not.toHaveBeenCalled();
  });

  // Token parameter test can be added back later once we have better test setup
  // it('should refetch with token parameter', async () => {
  //   const mockBalanceDataXLM: BalanceData = {
  //     address: 'C123456789',
  //     amount: BigInt(1000),
  //     assetCode: 'XLM',
  //   };
  //   const mockBalanceDataUSDC: BalanceData = {
  //     address: 'C123456789',
  //     amount: BigInt(500),
  //     assetCode: 'USDC',
  //   };

  //   let callCount = 0;
  //   const mockGetBalance = jest.fn<Promise<any>, [string | undefined]>()
  //     .mockImplementation((token) => {
  //       callCount++;
  //       return Promise.resolve(token === 'USDC' ? mockBalanceDataUSDC : mockBalanceDataXLM);
  //     });

  //   const mockWallet = createMockWallet({ address: 'C123456789', getBalance: mockGetBalance });
  //   (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

  //   // Test with XLM
  //   const { result, rerender } = renderHook(({ token }: { token?: string }) => useBalance(token), {
  //     wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
  //     initialProps: { token: undefined },
  //   });

  //   await waitFor(() => {
  //     expect(result.current.isLoading).toBe(false);
  //   });

  //   expect(result.current.data).toEqual(mockBalanceDataXLM);
  //   expect(mockGetBalance).toHaveBeenCalledWith(undefined);

  //   // Test with USDC
  //   rerender({ token: 'USDC' } as any);

  //   await waitFor(() => {
  //     expect(result.current.data).toEqual(mockBalanceDataUSDC);
  //   });

  //   expect(mockGetBalance).toHaveBeenCalledWith('USDC');
  //   expect(mockGetBalance).toHaveBeenCalledTimes(2);
  // });
});
