import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface TaskFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters?: any;
}

export default function TaskFilters({ visible, onClose, onApply, initialFilters }: TaskFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [workMode, setWorkMode] = useState<'all' | 'physical' | 'remote'>('all');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState(100);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialFilters) {
      setSelectedCategories(initialFilters.category_ids || []);
      setWorkMode(initialFilters.work_mode || 'all');
      setLocation(initialFilters.city || '');
      setDistance(initialFilters.radius || 100);
      setPriceRange([initialFilters.min_price || 0, initialFilters.max_price || 100000]);
    }
  }, [initialFilters]);

  const fetchCategories = async (query?: string) => {
    try {
      const url = query 
        ? `${API_BASE_URL}/categories?q=${query}`
        : `${API_BASE_URL}/categories`;
      
      const response = await fetch(url);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchCategories(text);
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApply = () => {
    onApply({
      category_ids: selectedCategories,
      work_mode: workMode,
      city: location,
      radius: distance,
      min_price: priceRange[0],
      max_price: priceRange[1],
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Categories Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.categoriesGrid}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategories.includes(category.id) && styles.selectedCategory
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text style={[
                      styles.categoryName,
                      selectedCategories.includes(category.id) && styles.selectedCategoryText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Work Mode Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Mode</Text>
              <View style={styles.workModeContainer}>
                {['all', 'physical', 'remote'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.workModeButton,
                      workMode === mode && styles.selectedWorkMode
                    ]}
                    onPress={() => setWorkMode(mode as any)}
                  >
                    <Ionicons
                      name={
                        mode === 'physical'
                          ? 'walk-outline'
                          : mode === 'remote'
                          ? 'laptop-outline'
                          : 'apps-outline'
                      }
                      size={20}
                      color={workMode === mode ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.workModeText,
                      workMode === mode && styles.selectedWorkModeText
                    ]}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Enter city..."
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#999"
              />
              <Text style={styles.sliderLabel}>Distance: {Math.round(distance)}km</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                value={distance}
                onValueChange={(value) => setDistance(Math.round(value))}
                minimumTrackTintColor="#2eac5f"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#2eac5f"
              />
            </View>

            {/* Price Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceLabel}>KES {Math.round(priceRange[0]).toLocaleString()}</Text>
                <Text style={styles.priceLabel}>KES {Math.round(priceRange[1]).toLocaleString()}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100000}
                value={priceRange[1]}
                onValueChange={(value) => setPriceRange([priceRange[0], Math.round(value)])}
                minimumTrackTintColor="#2eac5f"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#2eac5f"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedCategories([]);
                setWorkMode('all');
                setLocation('');
                setDistance(100);
                setPriceRange([0, 100000]);
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Figtree-SemiBold',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'Figtree-SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Figtree',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    width: (width - 32 - 16) / 3,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#2eac5f',
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Figtree',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  workModeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  workModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  selectedWorkMode: {
    backgroundColor: '#2eac5f',
  },
  workModeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Figtree',
  },
  selectedWorkModeText: {
    color: '#fff',
  },
  locationInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Figtree',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'Figtree',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Figtree',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2eac5f',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#2eac5f',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2eac5f',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
  },
}); 