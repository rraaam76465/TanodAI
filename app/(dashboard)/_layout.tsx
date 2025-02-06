import { Stack } from 'expo-router';
import CustomNavBar from '@/components/CustomNavBar';

export default function DashboardLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile"
          options={{ headerShown: false }}
        />
      </Stack>
      <CustomNavBar />
    </>
  );
}