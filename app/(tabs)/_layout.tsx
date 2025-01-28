import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,           // Hide top header
        tabBarShowLabel: false,       // Hide labels
        tabBarStyle: {
          backgroundColor: "transparent", // No background
          borderTopWidth: 0,              // Remove top border
          elevation: 0,                   // Remove shadow on Android
          position: 'absolute',           // Let you position your own buttons
          height: 0,                      // Fully hide tab bar if you want
        },
        animation: "fade",    
        tabBarIconStyle: {
          display: 'none', // Hide default icons, if you're using them
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarButton: () => null, // Hide default tab button completely
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          tabBarButton: () => null, // Hide default tab button completely
        }}
      />
      <Tabs.Screen
        name="my-tasks"
        options={{
          tabBarButton: () => null, // Hide default tab button completely
        }}
      />
    </Tabs>
  );
}
