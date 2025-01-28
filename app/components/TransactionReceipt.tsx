import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Transaction } from '../context/WalletContext';
import MPesaLogo from './MPesaLogo';
import { Text } from './Text';

interface TransactionReceiptProps {
  isVisible: boolean;
  onClose: () => void;
  transaction: Transaction;
}

const { height } = Dimensions.get('window');

export default function TransactionReceipt({ isVisible, onClose, transaction }: TransactionReceiptProps) {
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 9,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const formatReceiptDate = (dateString: string) => {
    return format(new Date(dateString.replace(' ', 'T')), 'MMM d, yyyy • h:mm a');
  };

  const handleShare = async () => {
    try {
      const message = `M-PESA Receipt\n\nAmount: KES ${transaction.amount.toLocaleString()}\nReference: ${transaction.reference}\nDate: ${formatReceiptDate(transaction.date)}\nType: ${transaction.transaction_type.toUpperCase()}\nDescription: ${transaction.description}\nPhone: ${transaction.number}`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Pressable style={styles.container} onPress={handleClose}>
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handle} />
        
        <View style={styles.header}>
          <MPesaLogo size="large" />
          <Text style={styles.title} bold>M-PESA</Text>
          <Text style={styles.subtitle}>Transaction Receipt</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.receiptContent}>
          <View style={styles.receiptRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value} bold>KES {transaction.amount.toLocaleString()}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.label}>Transaction Type</Text>
            <Text style={styles.value}>{transaction.transaction_type.toUpperCase()}</Text>
          </View>

          {transaction.transaction_fees > 0 && (
            <View style={styles.receiptRow}>
              <Text style={styles.label}>Transaction Fee</Text>
              <Text style={styles.value}>KES {transaction.transaction_fees.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.receiptRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatReceiptDate(transaction.date)}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.label}>Account Number</Text>
            <Text style={styles.value}>{transaction.number}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.shareButtonText} medium>Share Receipt</Text>
        </TouchableOpacity>

        <Text style={styles.poweredBy}>Powered by Safaricom</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 500 : 480,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#2eac5f',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
    marginVertical: 16,
  },
  receiptContent: {
    width: '100%',
    gap: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#000',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
    marginTop: 32,
    width: '100%',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  poweredBy: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
  },
}); 