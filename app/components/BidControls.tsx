import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { formatPrice } from '../utils/format';
import { Text } from './Text';

interface BidControlsProps {
  bottomSheetModalRef: React.RefObject<BottomSheetModal>;
  snapPoints: string[];
  taskBudget: string;
  onSubmitBid: (amount: number, message: string) => void;
}

export const BidControls: React.FC<BidControlsProps> = ({
  bottomSheetModalRef,
  snapPoints,
  taskBudget,
  onSubmitBid,
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  const handleBidSubmit = () => {
    const bidValue = parseFloat(bidAmount);
    const taskPrice = parseFloat(taskBudget);

    if (!bidAmount || bidValue <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }

    if (bidValue < taskPrice) {
      Alert.alert(
        'Invalid Bid Amount',
        `Your bid (${formatPrice(bidValue)}) cannot be less than the task budget (${formatPrice(taskPrice)})`
      );
      return;
    }

    setIsSubmittingBid(true);
    onSubmitBid(bidValue, bidMessage);
    setBidAmount('');
    setBidMessage('');
    setIsSubmittingBid(false);
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDismissOnClose
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.bottomSheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text bold style={styles.bottomSheetTitle}>
          Place Your Bid
        </Text>

        <View style={styles.bidForm}>
          <Text medium style={styles.inputLabel}>
            Your Bid Amount
          </Text>
          <View style={styles.bidInputContainer}>
            <Text style={styles.currencySymbol}>KES</Text>
            <TextInput
              style={styles.bidInput}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
              returnKeyType="next"
              editable={!isSubmittingBid}
            />
          </View>
          <Text style={styles.helperText}>
            Minimum bid: {formatPrice(parseFloat(taskBudget))}
          </Text>

          <Text medium style={styles.inputLabel}>
            Message (Optional)
          </Text>
          <TextInput
            style={styles.messageInput}
            value={bidMessage}
            onChangeText={setBidMessage}
            placeholder="Tell the task poster why you're the best person for this job"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            numberOfLines={6}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            editable={!isSubmittingBid}
          />

          <Pressable
            style={[
              styles.submitButton,
              isSubmittingBid && styles.submitButtonDisabled,
            ]}
            onPress={handleBidSubmit}
            disabled={isSubmittingBid}
          >
            {isSubmittingBid ? (
              <View style={styles.submitButtonLoading}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit Bid</Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bottomSheetTitle: {
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  bidForm: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 12,
    color: '#000',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  submitButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 