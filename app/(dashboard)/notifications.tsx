import React, { useState, useEffect } from 'react';
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
import * as Notifications from 'expo-notifications';

// Add this constant at the top after imports
const FLASK_SERVER_URL = 'http://172.16.44.151:5005';

export default function NotificationsScreen() {
  const [serverStatus, setServerStatus] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        payload => {
          if (payload.new.fire_detected) {
            setNotifications(current => [payload.new, ...current]);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const handleAcknowledge = async (id) => {
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
      setShowDetails(false);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const handleIgnore = async (id) => {
    try {
      const { error } = await supabase
        .from('sensor_readings')
        .update({ ignored: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(current =>
        current.map(notif =>
          notif.id === id ? { ...notif, ignored: true } : notif
        )
      );
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

  // Update the fetchNotifications function
  // Update fetchNotifications to get unignored notifications
  const fetchNotifications = async () => {
    try {
      // Test connection and table access
      console.log('Attempting to fetch sensor readings...');
      
      const { data, error } = await supabase
        .from('sensor_readings')
        .select(`
          id,
          timestamp,
          temperature,
          humidity,
          mq2_value,
          fire_detected,
          flame_sensor,
          camera_id,
          camera_ip,
          location,
          acknowledged,
          ignored,
          image_url
        `)
        .order('timestamp', { ascending: false });
      
      console.log('Supabase Response:', { data, error });
      
      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Number of records found:', data.length);
        const activeNotifications = data
          .filter(notification => !notification.ignored)
          .map(notification => ({
            ...notification,
            flame_detected: notification.fire_detected || notification.flame_sensor,
            timestamp: notification.timestamp || new Date().toISOString()
          }));
        
        console.log('Processed notifications:', activeNotifications);
        setNotifications(activeNotifications);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch notifications');
    }
  };

  // Update the subscription to handle new readings
  useEffect(() => {
    fetchNotifications();
    
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sensor_readings' }, // Listen to all changes
        payload => {
          console.log('Realtime event received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newNotification = {
              ...payload.new,
              timestamp: payload.new.timestamp || new Date().toISOString()
            };
            setNotifications(current => [newNotification, ...current]);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // Update the subscription to log more details
  useEffect(() => {
    fetchNotifications();
    
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        payload => {
          console.log('Realtime update received:', payload);
          if (payload.new) {
            setNotifications(current => [payload.new, ...current]);
          }
        }
      )
      .subscribe();

    // Log when subscription is established
    console.log('Supabase subscription initialized');

    return () => {
      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Update the subscription handler (remove duplicate subscriptions)
  useEffect(() => {
    fetchNotifications();
    
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        payload => {
          console.log('New sensor reading:', payload.new);
          if (payload.new && !payload.new.ignored) {
            const newNotification = {
              ...payload.new,
              flame_detected: payload.new.fire_detected || payload.new.flame_sensor,
              timestamp: payload.new.timestamp || new Date().toISOString()
            };
            setNotifications(current => [newNotification, ...current]);
          }
        }
      )
      .subscribe();

    console.log('Supabase subscription initialized');
    return () => subscription.unsubscribe();
  }, []);

  // Update the notification card render
  const renderNotificationCard = (notification) => (
    <View key={notification.id} style={styles.notificationCard}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={notification.flame_detected ? "flame" : "warning"} 
          size={24} 
          color={notification.flame_detected ? "#ff0000" : "#ffa500"} 
        />
      </View>
      
      <Text style={styles.alertTitle}>
        {notification.flame_detected ? 'Fire Detected!' : 'High Smoke Level'}
      </Text>
      
      <Text style={styles.timeText}>
        {new Date(notification.timestamp).toLocaleString()}
      </Text>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>
          Temperature: {notification.temperature}°C
        </Text>
        <Text style={styles.detailText}>
          Smoke Level: {notification.mq2_value}
        </Text>
        {notification.acknowledged && (
          <Text style={[styles.detailText, { color: '#4CAF50' }]}>
            ✓ Acknowledged
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!notification.acknowledged && (
          <TouchableOpacity
            style={[styles.actionButton, styles.acknowledgeButton]}
            onPress={() => handleAcknowledge(notification.id)}
          >
            <Text style={styles.actionButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.ignoreButton]}
          onPress={() => handleIgnore(notification.id)}
        >
          <Text style={styles.actionButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add this debug effect
  useEffect(() => {
    console.log('Current notifications state:', notifications);
  }, [notifications]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E26964"
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map(notification => renderNotificationCard(notification))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function for relative time
const getRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 24) {
    return `Today - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Yesterday - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const styles = StyleSheet.create({
  container: {
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeText: {
    color: '#666',
    marginBottom: 24,
  },
  circleContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#ff0000',
    borderRadius: 100,
    width: '100%',
    height: '100%',
    transform: [{scale: 0.4}],
  },
  detailsButton: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  detailsContainer: {
    width: '100%',
    marginVertical: 12,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
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
  acknowledgeButton: {
    backgroundColor: '#4CAF50',
  },
  ignoreButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});