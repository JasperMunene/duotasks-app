import { Stack } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { useNotification } from '../context/NotificationContext';

export default function NotificationTestScreen() {
  const { showNotification } = useNotification();

  const testNotifications = [
    {
      title: 'Simple Notification',
      onPress: () => {
        showNotification({
          title: 'Hello!',
          message: 'This is a basic notification',
        });
      },
    },
    {
      title: 'Notification with Image',
      onPress: () => {
        showNotification({
          title: 'New Message from John',
          message: 'Hey, how are you doing?',
          image: 'https://picsum.photos/200',
        });
      },
    },
    {
      title: 'Notification with Navigation',
      onPress: () => {
        showNotification({
          title: 'New Task Assigned',
          message: 'Check out your new task details',
          image: 'https://picsum.photos/200',
          route: '/(tabs)',
        });
      },
    },
    {
      title: 'Long Message Notification',
      onPress: () => {
        showNotification({
          title: 'System Update',
          message: 'A new system update is available with lots of new features and improvements. Check it out now!',
        });
      },
    },
    {
      title: 'Quick Succession',
      onPress: () => {
        // Show 3 notifications in quick succession
        showNotification({
          title: 'First Notification',
          message: 'This is the first of three notifications',
        });
        
        setTimeout(() => {
          showNotification({
            title: 'Second Notification',
            message: 'This is the second notification',
          });
        }, 1000);
        
        setTimeout(() => {
          showNotification({
            title: 'Third Notification',
            message: 'This is the final notification',
          });
        }, 2000);
      },
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notification Test',
          headerShown: true,
        }}
      />
      <ScrollView style={styles.container}>
        <Text style={styles.description}>
          Tap the buttons below to test different types of notifications
        </Text>
        <View style={styles.buttonContainer}>
          {testNotifications.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={item.onPress}
            >
              <Text medium style={styles.buttonText}>
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
}); 