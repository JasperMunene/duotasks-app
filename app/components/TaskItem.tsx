import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Task } from "../types/Task";
import { Text } from "./Text";

type TaskItemProps = {
  item: Task;
};

type StatusTag = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
  bgColor: string;
};

export function TaskItem({ item }: TaskItemProps) {
  const router = useRouter();

  const getStatusTag = (): StatusTag => {
    switch (item.status) {
      case 'open':
        return { icon: 'time-outline', text: 'Bidding', color: '#007AFF', bgColor: '#E8F2FF' };
      case 'assigned':
        return { icon: 'checkmark-circle-outline', text: 'Assigned', color: '#28a745', bgColor: '#E8F7E8' };
      case 'in_progress':
        return { icon: 'play-circle-outline', text: 'In Progress', color: '#FF9500', bgColor: '#FFF4E8' };
      case 'completed':
        return { icon: 'checkmark-done-circle-outline', text: 'Completed', color: '#28a745', bgColor: '#E8F7E8' };
      default:
        return { icon: 'time-outline', text: 'Bidding', color: '#007AFF', bgColor: '#E8F2FF' };
    }
  };

  const statusTag = getStatusTag();

  return (
    <Pressable 
      style={styles.taskItem} 
      onPress={() => router.push(`/(screens)/my-task/${item.id}`)}
    >
      <View style={styles.header}>
        <View style={[styles.tagContainer, { backgroundColor: statusTag.bgColor }]}>
          <Ionicons name={statusTag.icon} size={14} color={statusTag.color} />
          <Text style={[styles.tagText, { color: statusTag.color }]}>{statusTag.text}</Text>
        </View>
        <Text style={styles.priceText}>KES {item.budget.toLocaleString()}</Text>
      </View>

      <Text style={styles.taskName}>{item.name}</Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="tag-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.category || 'Uncategorized'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.location || 'Location not specified'}</Text>
        </View>
      </View>

      {item.assignment ? (
        <View style={styles.assignmentContainer}>
          <Image 
            source={{ uri: item.assignment.task_doer.image }} 
            style={styles.assigneeImage}
          />
          <View style={styles.assignmentInfo}>
            <Text style={styles.assigneeName}>{item.assignment.task_doer.name}</Text>
            <Text style={styles.agreedPrice}>
              Agreed: KES {item.assignment.agreed_price.toLocaleString()}
            </Text>
          </View>
          <View style={styles.assignmentStatus}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </View>
      ) : item.bids_count > 0 && (
        <View style={styles.bidsContainer}>
          <View style={styles.bidderImagesContainer}>
            {item.bids.map((bid, index) => (
              <View key={index} style={styles.bidderImageWrapper}>
                <Image source={{ uri: bid.bidder_image }} style={styles.bidderImage} />
              </View>
            ))}
          </View>
          <Text style={styles.bidsCountText}>{item.bids_count} bids received</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  assignmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  assigneeImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  assignmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assigneeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  agreedPrice: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 2,
  },
  assignmentStatus: {
    marginLeft: 8,
  },
  bidsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  bidderImagesContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  bidderImageWrapper: {
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bidderImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  bidsCountText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
}); 