import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { InAppNotification } from "./components/InAppNotification";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ConversationProvider } from "./context/ConversationContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import { WalletProvider } from "./context/WalletContext";
import { useSocketNotifications } from "./hooks/useSocketNotifications"; // adjust path if needed
function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const [fontsLoaded] = useFonts({
    Figtree: require("../assets/fonts/Figtree-Regular.ttf"),
    "Figtree-Medium": require("../assets/fonts/Figtree-Medium.ttf"),
    "Figtree-Bold": require("../assets/fonts/Figtree-Bold.ttf"),
  });
  
  useSocketNotifications(); // 👈 Add this here

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontFamily: "Figtree" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        style={"dark"}
        animated
        hidden={false}
        networkActivityIndicatorVisible={true}
      />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(screens)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{
            title: "404 Not Found",
            presentation: "modal",
          }}
        />
      </Stack>
      <NavigationHandler isAuthenticated={isAuthenticated} />
      <InAppNotification />
    </>
  );
}

// Separate component to handle navigation - this ensures it has access to navigation context
function NavigationHandler({ isAuthenticated }: { isAuthenticated: boolean }) {
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Only proceed if navigation state is ready
    if (!rootNavigationState?.key) return;

    try {
      const inAuthGroup = segments[0] === "(auth)";

      if (isAuthenticated && inAuthGroup) {
        router.replace("/(tabs)");
      } else if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)");
      }
    } catch (error) {
      // Navigation context not ready yet, will retry
      console.log('Navigation not ready:', error);
    }
  }, [isAuthenticated, segments, rootNavigationState?.key, router]);

  // Handle deep links when app is opened from closed state
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      
      // Check if it's a Google auth callback
      if (url.includes('duotasks://auth/deep_callback') || url.includes('duotasks:/auth/deep_callback')) {
        // Parse the URL
        let queryString = '';
        if (url.includes('?')) {
          queryString = url.split('?')[1];
        }

        const params: Record<string, string> = {};
        if (queryString) {
          queryString.split('&').forEach((param) => {
            const [key, value] = param.split('=');
            if (key && value) {
              params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          });
        }

        // Navigate to deep callback screen
        if (params.error || (params.token && params.email && params.id && params.name)) {
          const callbackUrl = `/(auth)/deep_callback?${queryString}`;
          router.replace(callbackUrl as any);
        }
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null; // This component doesn't render anything
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SocketProvider>
        <AuthProvider>
          <NotificationProvider>
            <ConversationProvider>
              <WalletProvider>
                <BottomSheetModalProvider>
                  <PortalProvider>
                    <RootLayoutNav />
                  </PortalProvider>
                </BottomSheetModalProvider>
              </WalletProvider>
            </ConversationProvider>
          </NotificationProvider>
        </AuthProvider>
      </SocketProvider>
    </GestureHandlerRootView>
  );
}
