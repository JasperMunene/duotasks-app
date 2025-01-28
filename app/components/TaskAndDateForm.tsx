import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { TaskFormData } from '../(screens)/post-task';
import { Text } from './Text';

interface TaskAndDateFormProps {
  data: TaskFormData;
  onNext: (data: Partial<TaskFormData>) => void;
}

export default function TaskAndDateForm({ data, onNext }: TaskAndDateFormProps) {
  const [title, setTitle] = useState(data.title || '');
  const [scheduleType, setScheduleType] = useState<'specific_day' | 'flexible'>(
    data.schedule_type || 'specific_day'
  );
  const [specificDate, setSpecificDate] = useState<Date | null>(
    data.specific_date ? new Date(data.specific_date) : null
  );
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(
    data.deadline_date ? new Date(data.deadline_date) : null
  );
  const [preferredTime, setPreferredTime] = useState<'morning' | 'midday' | 'afternoon' | 'evening'>(
    data.preferred_time || 'morning'
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'specific' | 'deadline'>('specific');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'specific') {
        setSpecificDate(selectedDate);
      } else {
        setDeadlineDate(selectedDate);
      }
    }
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleNext = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a task title');
      return;
    }

    if (scheduleType === 'specific_day' && !specificDate) {
      Alert.alert('Required Field', 'Please select a date');
      return;
    }

    if (scheduleType === 'flexible' && !deadlineDate) {
      Alert.alert('Required Field', 'Please select a deadline');
      return;
    }

    onNext({
      title: title.trim(),
      schedule_type: scheduleType,
      specific_date: specificDate?.toISOString() || null,
      deadline_date: deadlineDate?.toISOString() || null,
      preferred_time: preferredTime
    });
  };

  const timeSlots = [
    { value: 'morning', label: 'Morning (6AM - 12PM)' },
    { value: 'midday', label: 'Midday (12PM - 3PM)' },
    { value: 'afternoon', label: 'Afternoon (3PM - 6PM)' },
    { value: 'evening', label: 'Evening (6PM - 10PM)' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>What do you need done?</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Clean my backyard"
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>When do you need it done?</Text>
        
        <View style={styles.scheduleTypeContainer}>
          <TouchableOpacity
            style={[
              styles.scheduleTypeButton,
              scheduleType === 'specific_day' && styles.scheduleTypeButtonActive,
            ]}
            onPress={() => setScheduleType('specific_day')}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={scheduleType === 'specific_day' ? '#059669' : '#64748b'}
            />
            <Text
              style={[
                styles.scheduleTypeLabel,
                scheduleType === 'specific_day' && styles.scheduleTypeLabelActive,
              ]}
            >
              Specific Day
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scheduleTypeButton,
              scheduleType === 'flexible' && styles.scheduleTypeButtonActive,
            ]}
            onPress={() => setScheduleType('flexible')}
          >
            <Ionicons
              name="time-outline"
              size={24}
              color={scheduleType === 'flexible' ? '#059669' : '#64748b'}
            />
            <Text
              style={[
                styles.scheduleTypeLabel,
                scheduleType === 'flexible' && styles.scheduleTypeLabelActive,
              ]}
            >
              Flexible
            </Text>
          </TouchableOpacity>
        </View>

        {scheduleType === 'specific_day' ? (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDatePickerMode('specific');
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar" size={20} color="#64748b" />
            <Text style={styles.dateButtonText}>
              {formatDateForDisplay(specificDate)}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setDatePickerMode('deadline');
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="time" size={20} color="#64748b" />
            <Text style={styles.dateButtonText}>
              {formatDateForDisplay(deadlineDate)}
            </Text>
          </TouchableOpacity>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={datePickerMode === 'specific' ? specificDate || new Date() : deadlineDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.timeLabel}>Preferred time of day:</Text>
        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.value}
              style={[
                styles.timeSlotButton,
                preferredTime === slot.value && styles.timeSlotButtonActive,
              ]}
              onPress={() => setPreferredTime(slot.value)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  preferredTime === slot.value && styles.timeSlotTextActive,
                ]}
              >
                {slot.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Next: Location</Text>
        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  scheduleTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scheduleTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    gap: 8,
  },
  scheduleTypeButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  scheduleTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  scheduleTypeLabelActive: {
    color: '#059669',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  timeSlotsContainer: {
    gap: 8,
  },
  timeSlotButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  timeSlotButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#64748b',
  },
  timeSlotTextActive: {
    color: '#059669',
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});