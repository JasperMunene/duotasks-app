import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import MPesaLogo from '../components/MPesaLogo';
import { Text } from '../components/Text';
import TopUpModal from '../components/TopUpModal';
import TransactionReceipt from '../components/TransactionReceipt';
import VerifyMpesaBottomSheet from '../components/VerifyMpesaBottomSheet';
import WithdrawModal from '../components/WithdrawModal';
import { useAuth } from '../context/AuthContext';
import { Transaction, useWallet } from '../context/WalletContext';

// Animated balance number helper
function AnimatedBalance({ value, style }: { value: Animated.Value, style?: any }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  useEffect(() => {
    const id = value.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    return () => value.removeListener(id);
  }, [value]);
  return (
    <Text style={style}>KES {displayValue.toLocaleString()}</Text>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const { walletData, loading, error, fetchWalletData } = useWallet();
  const [mpesaNumber, setMpesaNumber] = useState('254712345678');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTopUpVisible, setIsTopUpVisible] = useState(false);
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newMpesaNumber, setNewMpesaNumber] = useState('');
  const {user} = useAuth();
  const [isMpesaVerificationVisible, setIsMpesaVerificationVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [animatedBalance] = useState(new Animated.Value(walletData?.balance || 0));
  
  useEffect(() => {
    if (walletData?.account_number) {
      setMpesaNumber(walletData.account_number);
    }
  }, [walletData]);

  useEffect(() => {
    Animated.timing(animatedBalance, {
      toValue: walletData?.balance || 0,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [walletData]);

  const accountBalance = walletData?.balance || 0;
  const availableBalance = walletData?.balance || 0;
  const pendingBalance = 0; // In this context, all balance is available unless specified otherwise by the API

  const transactions = walletData?.transactions || [];

  const updateMpesaNumber = () => {
    // Instead of showing the old modal, show the new bottom sheet
    setIsMpesaVerificationVisible(true);
    setNewMpesaNumber(''); // Clear any previous input
  };

  const formatTransactionDate = (dateString: string) => {
    // Assuming dateString is 'YYYY-MM-DD HH:MM:SS'
    // Replace space with 'T' to help Date constructor parse it as ISO string for better reliability
    return format(new Date(dateString.replace(' ', 'T')), 'MMM d, yyyy • h:mm a');
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  }, [fetchWalletData]);

  return (
    <View style={styles.containerPaypal}>
      {/* Header with Avatar */}
      <View style={styles.headerPaypal}>
        <Pressable onPress={() => router.back()} style={[styles.backButtonPaypal, { backgroundColor: '#2eac5f' }]}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitlePaypal}>Wallet</Text>
        <View style={styles.avatarContainerPaypal}>
          <Image
            source={{ uri: user?.image || 'https://i.pravatar.cc/150?img=8' }}
            style={styles.avatarPaypal}
          />
        </View>
      </View>

      {loading && !walletData ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading wallet data...</Text>
      ) : error ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>Error: {error}</Text>
      ) : (
        <ScrollView
          style={styles.contentPaypal}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2eac5f"
              colors={["#2eac5f"]}
            />
          }
        >
          {/* Balance Card with Animated Number */}
          <LinearGradient
            colors={["#2eac5f", "#2eac5f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCardPaypal}
          >
            <View style={styles.balanceSectionPaypal}>
              <Text style={styles.balanceLabelPaypal} medium>Account Balance</Text>
              <AnimatedBalance value={animatedBalance} style={styles.balanceAmountPaypal} />
              <View style={styles.balanceDetailsPaypal}>
                <View style={styles.balanceDetailRowPaypal}>
                  <View style={styles.balanceDetailLeftPaypal}>
                    <Text style={styles.availableLabelPaypal} medium>Available</Text>
                    <Text style={styles.availableAmountPaypal} bold>KES {availableBalance.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionButtonPaypal, styles.withdrawButtonPaypal]}
                    onPress={() => setIsWithdrawVisible(true)}
                  >
                    <Ionicons name="arrow-down-circle" size={20} color="#fff" />
                    <Text style={styles.withdrawTextPaypal} medium>Withdraw</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.balanceDetailRowPaypal}>
                  <View style={styles.balanceDetailLeftPaypal}>
                    <Text style={styles.pendingLabelPaypal} medium>Pending</Text>
                    <Text style={styles.pendingAmountPaypal} bold>KES {pendingBalance.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionButtonPaypal, styles.topUpButtonPaypal]}
                    onPress={() => setIsTopUpVisible(true)}
                  >
                    <Ionicons name="add-circle" size={20} color="#2eac5f" />
                    <Text style={styles.actionButtonTextPaypal} medium>Top Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Payment Method */}
          <View style={styles.sectionPaypal}>
            <Text style={styles.sectionTitlePaypal} bold>Payment Method</Text>
            <LinearGradient
              colors={["#e8f9f0", "#fff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mpesaCardEnhanced}
            >
              <View style={styles.mpesaHeaderEnhanced}>
                <View style={styles.mpesaLogoBadgeEnhanced}>
                  <MPesaLogo size="medium" />
                </View>
                <Text style={styles.mpesaLabelEnhanced} medium>M-Pesa</Text>
                <View style={styles.primaryBadgeEnhanced}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.primaryBadgeTextEnhanced}>Primary</Text>
                </View>
              </View>
              <View style={styles.mpesaDetailsEnhanced}>
                <Text style={styles.mpesaNumberEnhanced}>{mpesaNumber}</Text>
                <View style={styles.dividerEnhanced} />
                <TouchableOpacity 
                  style={styles.updateButtonEnhanced}
                  onPress={updateMpesaNumber}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.updateButtonTextEnhanced} medium>Update</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Transaction History */}
          <View style={styles.sectionPaypal}>
            <View style={styles.historyHeaderPaypal}>
              <Text style={styles.sectionTitlePaypal} bold>Transaction History</Text>
              <TouchableOpacity>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {transactions.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No transactions yet.</Text>
            ) : (
              <View style={styles.transactionListApp}>
                {transactions.map((transaction) => (
                  <View key={transaction.reference} style={styles.transactionCardApp}>
                    <View style={styles.transactionIconContainerApp}>
                      <View style={[styles.transactionIconCircleApp, { backgroundColor: transaction.transaction_type === 'credit' ? '#2eac5f' : '#e0e0e0' }] }>
                        <Ionicons
                          name={transaction.transaction_type === 'credit' ? 'arrow-down' : 'arrow-up'}
                          size={22}
                          color={transaction.transaction_type === 'credit' ? '#fff' : '#888'}
                        />
                      </View>
                    </View>
                    <View style={styles.transactionInfoApp}>
                      <View style={styles.transactionMainApp}>
                        <Text style={styles.transactionAmountApp} bold>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}KES {transaction.amount.toLocaleString()}
                        </Text>
                        <Text style={styles.transactionDateApp}>{formatTransactionDate(transaction.date)}</Text>
                      </View>
                      <Text style={styles.transactionDescApp}>{transaction.description} {transaction.transaction_fees > 0 ? `(+KES ${transaction.transaction_fees.toLocaleString()} fee)` : ''}</Text>
                      <Text style={styles.transactionPeriodApp}>
                        {transaction.transaction_type === 'credit' ? 'Received via' : 'To'} {transaction.number}
                      </Text>
                      <View style={styles.transactionRefRowApp}>
                        <MPesaLogo size="small" />
                        <Text style={styles.transactionRefApp}>•••• {transaction.reference.slice(-6)}</Text>
                        <TouchableOpacity 
                          style={styles.viewInvoiceApp}
                          onPress={() => handleViewReceipt(transaction)}
                        >
                          <Ionicons name="document-text-outline" size={16} color="#2eac5f" />
                          <Text style={styles.viewInvoiceTextApp}>View Receipt</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Top Up Modal */}
      <TopUpModal 
        isVisible={isTopUpVisible}
        mpesa_number={mpesaNumber}
        onClose={() => setIsTopUpVisible(false)}
        onSuccess={() => {
          setIsTopUpVisible(false);
          fetchWalletData();
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal 
        isVisible={isWithdrawVisible}
        onClose={() => setIsWithdrawVisible(false)}
        onSuccess={() => {
          setIsWithdrawVisible(false);
          fetchWalletData();
        }}
        balance={availableBalance}
      />

      {/* Transaction Receipt */}
      {selectedTransaction && (
        <TransactionReceipt
          isVisible={isReceiptVisible}
          onClose={() => {
            setIsReceiptVisible(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}

      {/* M-Pesa Verification Bottom Sheet */}
      <VerifyMpesaBottomSheet
        isVisible={isMpesaVerificationVisible}
        onClose={() => setIsMpesaVerificationVisible(false)}
        onVerificationSuccess={fetchWalletData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  containerPaypal: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  headerPaypal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#0083D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  backButtonPaypal: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#2eac5f',
  },
  headerTitlePaypal: {
    fontSize: 22,
    color: '#26292B',
    fontWeight: 'bold',
  },
  avatarContainerPaypal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e6f0fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarPaypal: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contentPaypal: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  balanceCardPaypal: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    borderRadius: 24,
    padding: 28,
    elevation: 8,
    backgroundColor: '#2eac5f',
    shadowColor: '#2eac5f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  balanceSectionPaypal: {
    width: '100%',
    alignItems: 'center',
  },
  balanceLabelPaypal: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmountPaypal: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 18,
    letterSpacing: 1,
  },
  balanceDetailsPaypal: {
    width: '100%',
    gap: 18,
  },
  balanceDetailRowPaypal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  balanceDetailLeftPaypal: {
    flex: 1,
  },
  availableLabelPaypal: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 2,
  },
  availableAmountPaypal: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  pendingLabelPaypal: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 2,
  },
  pendingAmountPaypal: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  actionButtonPaypal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 8,
    elevation: 2,
    shadowColor: '#2eac5f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topUpButtonPaypal: {
    backgroundColor: '#fff',
  },
  actionButtonTextPaypal: {
    color: '#2eac5f',
    fontSize: 15,
    fontWeight: 'bold',
  },
  withdrawButtonPaypal: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  withdrawTextPaypal: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionPaypal: {
    padding: 20,
  },
  sectionTitlePaypal: {
    fontSize: 18,
    marginBottom: 16,
  },
  mpesaCardEnhanced: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    elevation: 4,
    shadowColor: '#2eac5f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 8,
    marginTop: 2,
  },
  mpesaHeaderEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  mpesaLogoBadgeEnhanced: {
    backgroundColor: '#e8f9f0',
    borderRadius: 16,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpesaLabelEnhanced: {
    fontSize: 18,
    color: '#2eac5f',
    fontWeight: 'bold',
    marginRight: 10,
  },
  primaryBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2eac5f',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  primaryBadgeTextEnhanced: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  mpesaDetailsEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  mpesaNumberEnhanced: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dividerEnhanced: {
    width: 1,
    height: 28,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    borderRadius: 1,
  },
  updateButtonEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2eac5f',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 1,
  },
  updateButtonTextEnhanced: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyHeaderPaypal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionListApp: {
    gap: 16,
    marginTop: 2,
  },
  transactionCardApp: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#2eac5f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: 'flex-start',
  },
  transactionIconContainerApp: {
    marginRight: 16,
    marginTop: 2,
  },
  transactionIconCircleApp: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfoApp: {
    flex: 1,
  },
  transactionMainApp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  transactionAmountApp: {
    fontSize: 17,
    color: '#2eac5f',
    fontWeight: 'bold',
  },
  transactionDateApp: {
    fontSize: 13,
    color: '#888',
  },
  transactionDescApp: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  transactionPeriodApp: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  transactionRefRowApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  transactionRefApp: {
    fontSize: 13,
    color: '#aaa',
    marginLeft: 4,
  },
  viewInvoiceApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  viewInvoiceTextApp: {
    fontSize: 14,
    color: '#2eac5f',
    fontWeight: 'bold',
  },
});