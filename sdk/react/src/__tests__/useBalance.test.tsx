/**
 * Tests for useBalance hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useBalance, type BalanceData } from '../hooks/useBalance';
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
        retry: false, // Disable retries for tests
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

describe('useBalance', () => {
  it.skip('should return loading state initially', () => {
    // Placeholder
  });

  it.skip('should fetch and return balance data on success', async () => {
    // Placeholder
  });
});
