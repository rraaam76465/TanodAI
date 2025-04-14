import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for new fire detections
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        async (payload) => {
          if (payload.new.fire_detected) {
            await schedulePushNotification({
              title: '🔥 Fire Detected!',
              body: 'A fire has been detected in your monitored area.',
              data: { data: payload.new },
            });
          }
        }
      )
      .subscribe();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      subscription.unsubscribe();
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
}

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    alert('Failed to get push token for push notification!');
    return;
  }

  try {
    // Get the Expo push token
    const token = (await Notifications.getExpoPushTokenAsync({
      // Optionally specify your Expo project ID if needed, usually inferred
      // projectId: 'YOUR_EXPO_PROJECT_ID',
    })).data;
    console.log('Expo Push Token:', token);

    // !!! IMPORTANT: Send this token to your backend (e.g., Supabase) !!!
    // Example: await supabase.from('profiles').update({ push_token: token }).eq('id', userId);

  } catch (error) {
    console.error('Error getting Expo push token:', error);
    alert('Error getting Expo push token: ' + error);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'alert.mp3',
    });
  }
}

async function schedulePushNotification({ title, body, data }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'alert.mp3',
    },
    trigger: null,
  });
}