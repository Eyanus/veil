/**
 * Tests for useSendPayment hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSendPayment, type SendPaymentInput, type SendPaymentData } from '../hooks/useSendPayment';
import { VeilProvider } from '../provider';
import { useInvisibleWallet } from '../../../src';

// Mock useInvisibleWallet
jest.mock('../../../src', () => ({
  useInvisibleWallet: jest.fn(),
}));

const mockUseInvisibleWallet = useInvisibleWallet as jest.MockedFunction<
  typeof useInvisibleWallet
>;

// Setup
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <VeilProvider config={{
        factoryAddress: 'GTESTFACTORY',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015'
      }}>
        {children}
      </VeilProvider>
    </QueryClientProvider>
  );
};

describe('useSendPayment', () => {
  it.skip('should return initial state with idle status', () => {
    // Placeholder
  });

  it.skip('should handle successful payment submission', async () => {
    // Placeholder
  });
});
