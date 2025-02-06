import { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { user, loading } = useAuth();
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsSplashLoading(false);
    }, 2000); // Adjust timing as needed
  }, []);

  useEffect(() => {
    if (!isSplashLoading && !loading) {
      console.log('Navigating based on user state:', user);
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(dashboard)');
      }
    }
  }, [isSplashLoading, loading, user]);

  console.log('User:', user);
  console.log('Loading:', loading);

  if (isSplashLoading || loading) {
    return <CustomSplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(dashboard)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
