import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Text } from '../components/Text';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

// Import components (we'll create these next)
import BudgetForm from '../components/BudgetForm';
import DetailsForm from '../components/DetailsForm';
import LocationForm from '../components/LocationForm';
import ReviewForm from '../components/ReviewForm';
import TaskAndDateForm from '../components/TaskAndDateForm';

const { width } = Dimensions.get('window');

export type StepType = 1 | 2 | 3 | 4 | 5;

export interface TaskFormData {
  title: string;
  date: string;
  dateMode?: 'on' | 'before' | 'flexible';
  timeSlot?: 'morning' | 'midday' | 'afternoon' | 'evening';
  locationType: 'in-person' | 'online';
  description: string;
  images?: string[];
  budget: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  location?: string;
}

const steps = [
  { id: 1, label: 'Title & Date' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Details' },
  { id: 4, label: 'Budget' },
  { id: 5, label: 'Review' },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [step, setStep] = useState<StepType>(1);
  const [formData, setFormData] = useState<Partial<TaskFormData>>({});
  const [slideAnim] = useState(new Animated.Value(0));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (data: Partial<TaskFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = (newData?: Partial<TaskFormData>) => {
    if (newData) {
      updateFormData(newData);
    }
    
    // Animate slide transition
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(prev => (prev < 5 ? (prev + 1) as StepType : prev));
      slideAnim.setValue(0);
    });
  };

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: -1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep(prev => (prev > 1 ? (prev - 1) as StepType : prev));
      slideAnim.setValue(0);
    });
  };

  const handlePublish = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields based on task type
      const requiredFields = ['title', 'description', 'budget'];
      if (formData.locationType === 'in-person') {
        requiredFields.push('location', 'latitude', 'longitude');
      }
      if (formData.dateMode === 'on') {
        requiredFields.push('date', 'timeSlot');
      }
      
      const missingFields = requiredFields.filter(field => !formData[field as keyof TaskFormData]);
      
      if (missingFields.length > 0) {
        Alert.alert(
          'Missing Information',
          `Please fill in all required fields: ${missingFields.join(', ')}`
        );
        return;
      }
      console.log('Form Data:', formData);
      // Format the task data for the API
      const taskData = {
        title: formData.title,
        description: formData.description,
        work_mode: formData.locationType === 'in-person' ? 'physical' : 'remote',
        budget: parseFloat(formData.budget || '0'),
        schedule_type: formData.dateMode === 'on' ? 'specific_day' : 'flexible',
        specific_date: formData.dateMode === 'on' ? formData.date : null,
        deadline_date: formData.dateMode === 'before' ? formData.date : null,
        preferred_time: formData.timeSlot,
        images: formData.images || [],
        ...(formData.locationType === 'in-person' && {
          latitude: formData.latitude,
          longitude: formData.longitude,
          country: formData.country || 'Kenya',
          state: formData.state,
          city: formData.city,
          area: formData.area
        })
      };

      // Log the data for debugging
      console.log('Form Data:', {
        locationType: formData.locationType,
        dateMode: formData.dateMode,
        date: formData.date,
        timeSlot: formData.timeSlot,
        location: formData.location
      });
      console.log('API Payload:', taskData);

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const data = await response.json();
      
      Alert.alert(
        '🎉 Task Posted Successfully!',
        'Your task is now live and visible to potential taskers.',
        [
          {
            text: 'View My Task',
            onPress: () => router.push(`/my-task/${data.id}`),
            style: 'default',
          },
          {
            text: 'Post Another Task',
            onPress: () => {
              setStep(1);
              setFormData({});
            },
            style: 'default',
          },
          {
            text: 'Back to Home',
            onPress: () => router.push('/(tabs)'),
            style: 'cancel',
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create task. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    const slideTransform = {
      transform: [
        {
          translateX: slideAnim.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-width, 0, width],
          }),
        },
      ],
    };

    switch (step) {
      case 1:
        return (
          <Animated.View style={slideTransform}>
            <TaskAndDateForm data={formData as TaskFormData} onNext={handleNext} />
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={slideTransform}>
            <LocationForm 
              data={formData as TaskFormData} 
              onNext={handleNext} 
              onBack={handleBack} 
            />
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View style={slideTransform}>
            <DetailsForm 
              data={formData as TaskFormData} 
              onNext={handleNext} 
              onBack={handleBack} 
            />
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View style={slideTransform}>
            <BudgetForm 
              data={formData as TaskFormData} 
              onNext={handleNext} 
              onBack={handleBack} 
            />
          </Animated.View>
        );
      case 5:
        return (
          <Animated.View style={slideTransform}>
            <ReviewForm 
              data={formData as TaskFormData} 
              onBack={handleBack} 
              onPublish={handlePublish}
              isSubmitting={isSubmitting}
            />
          </Animated.View>
        );
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    if (step <= 2) return "Let's start with the basics";
    if (step < 5) return "More details to help us help you";
    return "Ready to publish your task";
  };

  const getHeaderSubtitle = () => {
    if (step <= 2) return "Tell us what you need done, and we'll help you find the right person for the job.";
    if (step < 5) return "Now let's add all the details needed to help taskers understand your needs.";
    return "Review everything before posting your task to our community.";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Task</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(step / 5) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>Step {step} of 5</Text>
      </View>

      {/* Step Indicators */}
      {/* <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.stepIndicators}
        contentContainerStyle={styles.stepIndicatorsContent}
      >
        {steps.map((item, index) => (
          <View key={item.id} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                step === item.id && styles.stepCircleActive,
                step > item.id && styles.stepCircleCompleted,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  step === item.id && styles.stepNumberActive,
                  step > item.id && styles.stepNumberCompleted,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                step === item.id && styles.stepLabelActive,
                step > item.id && styles.stepLabelCompleted,
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView> */}

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>{getHeaderTitle()}</Text>
          <Text style={styles.contentSubtitle}>{getHeaderSubtitle()}</Text>
        </View>

        <View style={styles.formContainer}>
          {renderForm()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // Compensate for close button width
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginRight: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  stepIndicators: {
    backgroundColor: 'red',
    borderBottomWidth: 1,
    height: 0,
    borderBottomColor: '#e2e8f0',
  },
  stepIndicatorsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepItem: {
    alignItems: 'center',
    marginRight: 32,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#059669',
  },
  stepCircleCompleted: {
    backgroundColor: '#dcfce7',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepNumberCompleted: {
    color: '#059669',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  stepLabelActive: {
    color: '#059669',
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: '#059669',
  },
  content: {
    flex: 1,
  },
  contentHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
});