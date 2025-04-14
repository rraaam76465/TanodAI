import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { DetectionDetails } from '@/components/DetectionDetails';

// Add this constant at the top after imports
// TODO: Move to environment variables
const FLASK_SERVER_URL = 'http://192.168.1.5:5005'; 

// Define type for consistency with index.tsx
interface SensorReading {
  id: number;
  timestamp: string;
  temperature?: number; // Optional fields based on your select
  humidity?: number;
  mq2_value?: number;
  ai_fire_detected?: boolean; // Use consistent naming
  smoke_detected?: boolean; // Use consistent naming
  flame_sensor?: boolean; // Keep if used separately
  camera_id?: string;
  camera_ip?: string;
  location?: string;
  acknowledged?: boolean;
  ignored?: boolean;
  image_url?: string;
}

export default function NotificationsScreen() {
  const [serverStatus, setServerStatus] = useState(false);
  const [notifications, setNotifications] = useState<SensorReading[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SensorReading | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Define fetchNotifications outside useEffect so it can be called by onRefresh
  const fetchNotifications = useCallback(async () => {
    console.log('Attempting to fetch sensor readings...');
    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select(`
          id,
          timestamp,
          temperature,
          humidity,
          mq2_value,
          ai_fire_detected,
          smoke_detected,
          flame_sensor,
          camera_id,
          camera_ip,
          location,
          acknowledged,
          ignored,
          image_url
        `)
        .eq('ignored', false)
        .order('timestamp', { ascending: false });

      console.log('Supabase Fetch Response:', { data, error });

      if (error) {
        console.error('Supabase Fetch Error:', error);
        Alert.alert('Error', 'Failed to fetch notifications');
        // Don't throw here to allow component to render potentially cached data
      } else if (data) {
        console.log('Number of records found:', data.length);
        setNotifications(data as SensorReading[]);
      }
    } catch (error) {
      console.error('Fetch error caught:', error);
      Alert.alert('Error', 'Failed to fetch notifications');
    }
  }, []); // useCallback dependency array

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  }, [fetchNotifications]); // Add fetchNotifications as dependency

  const handleAcknowledge = async (id: number) => {
    try {
      const { error } = await supabase
        .from('sensor_readings')
        .update({ acknowledged: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(current =>
        current.map(notif =>
          notif.id === id ? { ...notif, acknowledged: true } : notif
        )
      );
      setSelectedAlert(null); // Clear selected alert
      setShowDetails(false);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const handleIgnore = async (id: number) => {
    try {
      const { error } = await supabase
        .from('sensor_readings')
        .update({ ignored: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(current =>
        current.filter(notif => notif.id !== id) // Remove ignored notification from list
      );
      setSelectedAlert(null); // Clear selected alert
      setShowDetails(false);
    } catch (error) {
      console.error('Error ignoring alert:', error);
      Alert.alert('Error', 'Failed to ignore alert');
    }
  };

  // Server status check effect
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${FLASK_SERVER_URL}/health-check`);
        setServerStatus(response.ok);
      } catch (error) {
        console.error('Server check failed:', error);
        setServerStatus(false);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Combined fetch and subscribe effect
  useEffect(() => {
    let isMounted = true;
    let realtimeChannel: any = null;

    // Initial fetch when component mounts
    fetchNotifications();

    // Setup subscription
    realtimeChannel = supabase
      .channel('public:sensor_readings')
      .on<SensorReading>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          if (!isMounted) return;
          console.log('Realtime event:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              const newNotification = payload.new as SensorReading;
              if (!newNotification.ignored) {
                // Add to the beginning of the list, prevent duplicates
                setNotifications(current => 
                  current.find(n => n.id === newNotification.id) 
                  ? current 
                  : [newNotification, ...current]
                );
              }
              break;
            case 'UPDATE':
              const updatedNotification = payload.new as SensorReading;
              setNotifications(current => {
                if (updatedNotification.ignored) {
                  // Remove if ignored
                  return current.filter(n => n.id !== updatedNotification.id);
                } else {
                  // Update if acknowledged or other change
                  return current.map(n => n.id === updatedNotification.id ? updatedNotification : n);
                }
              });
              break;
            case 'DELETE':
              const oldNotification = payload.old as Partial<SensorReading>; // OLD record only has primary key by default
              if (oldNotification.id) {
                 setNotifications(current => current.filter(n => n.id !== oldNotification.id));
              }
              break;
            default:
              break;
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("Supabase Subscription Error:", err);
        } else {
          console.log("Supabase Subscription Status:", status);
        }
      });

    // Cleanup function
    return () => {
      isMounted = false;
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        console.log('Supabase channel removed');
      }
    };

  }, [fetchNotifications]); // Add fetchNotifications as dependency

  const renderNotificationCard = (notification: SensorReading) => (
    <View key={notification.id} style={styles.notificationCard}>
      <View style={styles.iconContainer}>
        <Ionicons 
          // Use ai_fire_detected and smoke_detected for consistency
          name={notification.ai_fire_detected ? "flame" : (notification.smoke_detected ? "cloud" : "warning")} 
          size={24} 
          color={notification.ai_fire_detected ? "#ff0000" : (notification.smoke_detected ? "#ffa500" : "#f0e68c")}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.textContainer}
        onPress={() => { setSelectedAlert(notification); setShowDetails(true); }}
      >
        <Text style={styles.notificationTitle}>
          {notification.ai_fire_detected ? 'Fire Detected' : (notification.smoke_detected ? 'Smoke Detected' : 'Sensor Alert')}
        </Text>
        <Text style={styles.notificationTimestamp}>
          {getRelativeTime(notification.timestamp)}
        </Text>
        <Text style={styles.notificationLocation} numberOfLines={1}>
          Location: {notification.location || 'N/A'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.actionContainer}>
        {!notification.acknowledged && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleAcknowledge(notification.id)}
          >
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleIgnore(notification.id)}
        >
          <Ionicons name="eye-off" size={24} color="#9E9E9E" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={[styles.serverStatusDot, { backgroundColor: serverStatus ? '#4CAF50' : '#f44336' }]} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.noNotificationsContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.noNotificationsText}>No active notifications</Text>
          </View>
        ) : (
          notifications.map(renderNotificationCard)
        )}
      </ScrollView>

      {selectedAlert && (
        <DetectionDetails 
          visible={showDetails}
          onClose={() => { setShowDetails(false); setSelectedAlert(null); }}
          data={selectedAlert}
          onAcknowledge={() => handleAcknowledge(selectedAlert.id)}
          onIgnore={() => handleIgnore(selectedAlert.id)}
        />
      )}
    </SafeAreaView>
  );
}

const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  serverStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  notificationCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff5f5',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  notificationTimestamp: {
    color: '#666',
    marginBottom: 24,
  },
  notificationLocation: {
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
});