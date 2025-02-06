import { Stack } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ 
          headerShown: false,
          tabBarStyle: { display: 'none' } // Hide the default tab bar
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{ title: 'Alerts' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Stack>
  );
} 