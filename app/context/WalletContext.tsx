import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export interface Transaction {
  date: string;
  reference: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  transaction_fees: number;
  description: string;
  number: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  payment_method: string;
  account_number: string;
  transactions: Transaction[];
}

interface WalletContextType {
  walletData: Wallet | null;
  loading: boolean;
  error: string | null;
  fetchWalletData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletData, setWalletData] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { accessToken, user } = useAuth();
  const { socket } = useSocket(); // For future socket integration

  const fetchWalletData = useCallback(async () => {
    if (!accessToken) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/wallet`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet data: ${response.statusText}`);
      }

      const data: Wallet = await response.json();
      setWalletData(data);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Future: Socket integration for real-time updates
  // useEffect(() => {
  //   if (!socket) return;

  //   const handleWalletUpdate = (data: Wallet) => {
  //     console.log('Wallet update received via socket:', data);
  //     setWalletData(data);
  //   };

  //   socket.on('wallet_update', handleWalletUpdate);

  //   return () => {
  //     socket.off('wallet_update', handleWalletUpdate);
  //   };
  // }, [socket]);

  return (
    <WalletContext.Provider
      value={{
        walletData,
        loading,
        error,
        fetchWalletData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 