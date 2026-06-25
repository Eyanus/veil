/**
 * Tests for useSendPayment hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { Networks } from '@stellar/stellar-sdk';
import { VeilProvider } from '../provider';
import type { WalletConfig, InvisibleWallet } from '../../../src/useInvisibleWallet';
import { useSendPayment, type SendPaymentInput, type SendPaymentData } from '../hooks/useSendPayment';

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

// Mock fee payer (using a simple object instead of real Keypair for test)
const testFeePayer = { secret: () => 'STEST', publicKey: () => 'GTEST' } as any;

describe('useSendPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state with idle status', () => {
    const mockWallet = createMockWallet();
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should set loading state when mutation is called', async () => {
    const mockSend = jest.fn<Promise<SendPaymentData>, any[]>()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    const mockWallet = createMockWallet({ sendPayment: mockSend });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    const input: SendPaymentInput = {
      feePayer: testFeePayer,
      to: 'G456DEF',
      amount: 500,
    };

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should handle successful payment submission', async () => {
    const mockPaymentData: SendPaymentData = {
      transactionHash: 'abc123def456',
      status: 'PENDING',
    };

    const mockSend = jest.fn<Promise<SendPaymentData>, any[]>().mockResolvedValue(mockPaymentData);
    const mockWallet = createMockWallet({ sendPayment: mockSend });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    const input: SendPaymentInput = {
      feePayer: testFeePayer,
      to: 'G456DEF',
      amount: 500,
    };

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data).toEqual(mockPaymentData);
    expect(result.current.error).toBeNull();
    expect(mockSend).toHaveBeenCalledWith(
      input.feePayer,
      input.to,
      input.amount,
      input.token,
      input.memo,
    );
  });

  it('should handle payment submission errors', async () => {
    const mockError = new Error('Insufficient balance');
    const mockSend = jest.fn<Promise<SendPaymentData>, any[]>().mockRejectedValue(mockError);
    const mockWallet = createMockWallet({ sendPayment: mockSend });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    const input: SendPaymentInput = {
      feePayer: testFeePayer,
      to: 'G456DEF',
      amount: 500,
    };

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
    expect(mockSend).toHaveBeenCalledWith(
      input.feePayer,
      input.to,
      input.amount,
      input.token,
      input.memo,
    );
  });

  it('should support all SendPaymentInput fields', async () => {
    const mockPaymentData: SendPaymentData = {
      transactionHash: 'abc123',
      status: 'SUCCESS',
    };

    const mockSend = jest.fn<Promise<SendPaymentData>, any[]>().mockResolvedValue(mockPaymentData);
    const mockWallet = createMockWallet({ sendPayment: mockSend });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    const input: SendPaymentInput = {
      feePayer: testFeePayer,
      to: 'G456DEF',
      amount: 1000,
      token: 'CUSDC',
      memo: 'Payment for services',
    };

    act(() => {
      result.current.mutate(input);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data).toEqual(mockPaymentData);
    expect(mockSend).toHaveBeenCalledWith(
      input.feePayer,
      input.to,
      input.amount,
      input.token,
      input.memo,
    );
  });

  it('should reset error when calling mutate again', async () => {
    let callCount = 0;
    const mockSend = jest.fn<Promise<SendPaymentData>, any[]>().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('First call failed'));
      }
      return Promise.resolve({ transactionHash: 'success123', status: 'SUCCESS' });
    });

    const mockWallet = createMockWallet({ sendPayment: mockSend });
    (mockUseInvisibleWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: ({ children }) => <VeilProvider config={testConfig}>{children}</VeilProvider>,
    });

    // First call - fails
    act(() => {
      result.current.mutate({ feePayer: testFeePayer, to: 'G456DEF', amount: 500 });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.error).not.toBeNull();

    // Second call - succeeds
    act(() => {
      result.current.mutate({ feePayer: testFeePayer, to: 'G456DEF', amount: 500 });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data?.status).toBe('SUCCESS');
  });
});
