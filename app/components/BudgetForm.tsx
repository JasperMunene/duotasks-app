import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { TaskFormData } from '../(screens)/post-task';
import { Text } from './Text';

interface BudgetFormProps {
  data: TaskFormData;
  onNext: (data: Partial<TaskFormData>) => void;
  onBack: () => void;
}

const budgetSuggestions = [
  { amount: '500', label: 'Small task' },
  { amount: '1000', label: 'Medium task' },
  { amount: '2000', label: 'Large task' },
  { amount: '5000', label: 'Complex task' },
];

export default function BudgetForm({ data, onNext, onBack }: BudgetFormProps) {
  const [budget, setBudget] = useState(String(data.budget || ''));
  const [isCustom, setIsCustom] = useState(!budgetSuggestions.some(s => s.amount === budget));

  const handleBudgetChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1]?.length > 2) {
      return;
    }

    setBudget(numericValue);
    setIsCustom(true);
  };

  const handleSuggestionPress = (amount: string) => {
    setBudget(amount);
    setIsCustom(false);
  };

  const handleNext = () => {
    if (!budget) {
      Alert.alert('Required Field', 'Please set a budget for your task');
      return;
    }

    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount');
      return;
    }

    onNext({ budget: budgetAmount });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Set your budget</Text>
        <Text style={styles.hint}>
          How much are you willing to pay for this task? This helps taskers understand your expectations.
        </Text>

        <View style={styles.budgetInputContainer}>
          <Text style={styles.currencySymbol}>KES</Text>
          <TextInput
            style={styles.budgetInput}
            value={budget}
            onChangeText={handleBudgetChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Text style={styles.suggestionsLabel}>Suggested budgets:</Text>
        <View style={styles.suggestionsContainer}>
          {budgetSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.amount}
              style={[
                styles.suggestionButton,
                budget === suggestion.amount && styles.suggestionButtonActive,
              ]}
              onPress={() => handleSuggestionPress(suggestion.amount)}
            >
              <Text
                style={[
                  styles.suggestionAmount,
                  budget === suggestion.amount && styles.suggestionAmountActive,
                ]}
              >
                KES {parseInt(suggestion.amount).toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.suggestionLabel,
                  budget === suggestion.amount && styles.suggestionLabelActive,
                ]}
              >
                {suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.tipContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#64748b" />
        <Text style={styles.tipText}>
          Your budget is a starting point. Taskers may propose different amounts based on their experience and the task requirements.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next: Review</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
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
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    color: '#0f172a',
    paddingVertical: 12,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 12,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    flex: 1,
    minWidth: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  suggestionButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  suggestionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  suggestionAmountActive: {
    color: '#059669',
  },
  suggestionLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  suggestionLabelActive: {
    color: '#059669',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
