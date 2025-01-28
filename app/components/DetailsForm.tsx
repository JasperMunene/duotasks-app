import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { TaskFormData } from '../(screens)/post-task';
import { Text as CustomText } from './Text';

interface DetailsFormProps {
  data: TaskFormData;
  onNext: (data: Partial<TaskFormData>) => void;
  onBack: () => void;
}

export default function DetailsForm({ data, onNext, onBack }: DetailsFormProps) {
  const [description, setDescription] = useState(data.description || '');
  const [images, setImages] = useState<string[]>(data.images || []);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter a task description');
      return;
    }

    onNext({
      description: description.trim(),
      images,
    });
  };

  const descriptionTips = [
    'What exactly needs to be done?',
    'Any specific requirements or preferences?',
    'What materials or tools are needed?',
    'Any deadlines or time constraints?',
    'What does success look like for this task?',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Description */}
      <View style={styles.section}>
        <CustomText style={styles.label}>Describe your task</CustomText>
        <CustomText style={styles.hint}>
          Be specific about what needs to be done, any requirements, and what you expect from the tasker
        </CustomText>
        
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., I need help moving furniture from my apartment to a new location. The items include a sofa, dining table, and bedroom set. I'll need help with disassembly, loading, and unloading."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        <View style={styles.inputFooter}>
          <CustomText style={styles.charCount}>{description.length}/1000</CustomText>
          <CustomText style={styles.minLength}>
            {description.length < 20 ? `${20 - description.length} more characters needed` : '✓ Good length'}
          </CustomText>
        </View>
      </View>

      {/* Description Tips */}
      <View style={styles.section}>
        <CustomText style={styles.tipsLabel}>Consider including:</CustomText>
        <View style={styles.tipsContainer}>
          {descriptionTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
              <CustomText style={styles.tipText}>{tip}</CustomText>
            </View>
          ))}
        </View>
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <CustomText style={styles.label}>Add photos (optional)</CustomText>
        <CustomText style={styles.hint}>
          Upload photos to help taskers understand the job better
        </CustomText>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imageScrollView}
        >
          <TouchableOpacity 
            style={styles.addImageButton} 
            onPress={pickImage}
            disabled={isUploading}
          >
            <Ionicons name="add-circle-outline" size={32} color="#64748b" />
            <CustomText style={styles.addImageText}>Add Photo</CustomText>
          </TouchableOpacity>

          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Pro Tips */}
      <View style={styles.section}>
        <View style={styles.proTipCard}>
          <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
          <View style={styles.proTipContent}>
            <CustomText style={styles.proTipTitle}>Pro Tip</CustomText>
            <CustomText style={styles.proTipText}>
              Tasks with detailed descriptions and photos receive 3x more proposals 
              and are completed 40% faster on average.
            </CustomText>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <CustomText style={styles.backButtonText}>Back</CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNext}
          disabled={isUploading}
        >
          <CustomText style={styles.nextButtonText}>Next: Set Budget</CustomText>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
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
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 120,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  minLength: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  tipsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  tipsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
  },
  imageScrollView: {
    flexDirection: 'row',
    marginTop: 8,
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  proTipCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  proTipContent: {
    flex: 1,
    marginLeft: 12,
  },
  proTipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});