import { Stack } from 'expo-router';

export default function ScreenLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: "" // Completely hides the header for all auth screens
      }}
    >
      
      {/* Your auth screens go here, e.g. login, signup */}
    </Stack>
  );
} 