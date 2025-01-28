import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useMemo } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface ActivityBottomSheetProps {
  activity: {
    id: string;
    type: 'posted' | 'completed';
    title: string;
    date: string;
    amount?: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    category: string;
    description: string;
  } | null;
  isVisible: boolean;
  onDismiss: () => void;
}

export const ActivityBottomSheet = React.forwardRef<BottomSheetModal, ActivityBottomSheetProps>(
  ({ activity, onDismiss }, ref) => {
    const snapPoints = useMemo(() => ['50%', '75%'], []);

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return '#2eac5f';
        case 'in_progress':
          return '#f4a261';
        case 'pending':
          return '#666';
        case 'cancelled':
          return '#ff4444';
        default:
          return '#666';
      }
    };

    const handleShare = async () => {
      if (!activity) return;
      
      try {
        await Share.share({
          message: `Task: ${activity.title}\nStatus: ${activity.status}\nCategory: ${activity.category}\nDate: ${activity.date}`,
          title: 'Task Details',
        });
      } catch (error) {
        console.error(error);
      }
    };

    if (!activity) return null;

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title} medium>{activity.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(activity.status)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]} medium>
                  {activity.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#000" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value} medium>{activity.category}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value} medium>{formatDate(activity.date)}</Text>
            </View>

            {activity.amount && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Amount</Text>
                <Text style={[styles.value, styles.amount]} medium>
                  KES {activity.amount.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>{activity.description}</Text>
            </View>
          </View>
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#fff',
  },
  indicator: {
    backgroundColor: '#ddd',
    width: 40,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  shareButton: {
    padding: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#000',
  },
  amount: {
    color: '#2eac5f',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
}); 