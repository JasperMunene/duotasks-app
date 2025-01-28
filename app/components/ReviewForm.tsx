import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { TaskFormData } from '../(screens)/post-task';
import { formatPrice } from '../utils/format';
import { Text } from './Text';

interface ReviewFormProps {
  data: TaskFormData;
  onBack: () => void;
  onPublish: () => void;
  isSubmitting: boolean;
}

export default function ReviewForm({ data, onBack, onPublish, isSubmitting }: ReviewFormProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeSlotText = (slot?: string) => {
    if (!slot) return '';
    const timeSlots: Record<string, string> = {
      morning: '6AM - 12PM',
      midday: '12PM - 3PM',
      afternoon: '3PM - 6PM',
      evening: '6PM - 10PM',
    };
    return timeSlots[slot] || '';
  };

  const getDateModeText = (mode?: string) => {
    if (!mode) return '';
    const modes: Record<string, string> = {
      on: 'On this date',
      before: 'Before this date',
      flexible: 'Flexible date',
    };
    return modes[mode] || '';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Details</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Title</Text>
          <Text style={styles.detailValue}>{data.title}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{data.description}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Budget</Text>
          <Text style={[styles.detailValue, styles.budgetValue]}>
            {formatPrice(Number(data.budget || 0))}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {data.dateMode === 'on' 
              ? (data.date ? formatDate(data.date) : 'Not specified')
              : (data.dateMode === 'before' ? `Before ${formatDate(data.date)}` : 'Flexible date')}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Preferred Time</Text>
          <Text style={styles.detailValue}>{getTimeSlotText(data.timeSlot)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>
            {data.locationType === 'in-person' ? 'In-person' : 'Remote'}
          </Text>
        </View>

        {data.locationType === 'in-person' && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>
              {[data.area, data.city, data.state, data.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {data.images && data.images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesContainer}
          >
            {data.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]} 
          onPress={onPublish}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.publishButtonText}>Post Task</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#0f172a',
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#059669',
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
});
