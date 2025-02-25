import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '@/hooks/useAuth';
import { useWeather } from '@/hooks/useWeather';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import mqtt from 'precompiled-mqtt';
import { DetectionAlert } from '@/components/DetectionAlert';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

interface User {
  user_metadata?: {
    firstName?: string;
  };
}

export default function DashboardScreen() {
  const { user } = useAuth() as User;
  const { weather, loading, error } = useWeather();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('User');
  const [systemStatus, setSystemStatus] = useState({
    operational: false,
    networkConnected: true,
    lastCheck: new Date(),
  });

  // Replace the device status check with sensor readings check
  useEffect(() => {
    // Update the checkDeviceStatus function
    // Replace the checkDeviceStatus function
    // Fix the checkDeviceStatus function
      const checkDeviceStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1);
          
          if (error) throw error;
          
          // Check if we have recent data (within last 60 seconds)
          const isRecent = data?.[0] && 
            (new Date().getTime() - new Date(data[0].timestamp).getTime()) < 60000;
          
          setSystemStatus(current => ({
            ...current,
            operational: Boolean(data?.[0]),  // Set operational if we have any data
            networkConnected: true,
            lastCheck: new Date()
          }));
        } catch (error) {
          console.error('Error checking sensor status:', error);
          setSystemStatus(current => ({
            ...current,
            operational: false,
            networkConnected: false,
            lastCheck: new Date()
          }));
        }
      };
    
    // Initial check
    checkDeviceStatus();

    // Check every 10 seconds
    const interval = setInterval(checkDeviceStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Remove the separate device status subscription and keep the sensor readings one
  useEffect(() => {
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        payload => {
          setRecentAlerts(current => [payload.new, ...current].slice(0, 3));
          
          setSystemStatus(current => ({
            ...current,
            lastCheck: new Date(),
            operational: true,
            networkConnected: true
          }));
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const getUserInitial = () => {
    return user?.raw_user_meta_data?.name?.charAt(0) || 'U';
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.name) {
        setName(session.user.user_metadata.name);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    };

    fetchLocation();
  }, []);

  // Update the subscription useEffect
  // At the top of your file, add this
  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable notifications to receive alerts');
      }
    };
    // Add this before the DashboardScreen component
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    requestPermissions();
  }, []);

  // Modify your sensor readings subscription
  // In your sensor readings subscription
  useEffect(() => {
    const subscription = supabase
      .channel('sensor_readings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        async (payload) => {
          if (payload.new.ai_fire_detected || payload.new.smoke_detected) {
            try {
              // Local notification
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: payload.new.ai_fire_detected ? "🚨 Fire Alert!" : "⚠️ Smoke Alert",
                  body: `${payload.new.ai_fire_detected ? "Fire" : "Smoke"} has been detected in your area.`,
                },
                trigger: null,
              });
    
              // Call Edge Function for email alert
              const { data, error } = await supabase.functions.invoke('test-alert', {
                body: { 
                  email: user?.email,
                  alert_type: payload.new.ai_fire_detected ? 'fire' : 'smoke',
                  location: `${region.latitude}, ${region.longitude}`
                }
              });

              if (error) {
                console.error('Error sending alert:', error);
              }
            } catch (error) {
              console.error('Error processing alert:', error);
            }
          }
          
          setRecentAlerts(current => [payload.new, ...current].slice(0, 3));
          setSystemStatus(current => ({
            ...current,
            lastCheck: new Date(),
            operational: !payload.new.ai_fire_detected,
          }));
        }
      )
      .subscribe();
  
    // Fetch initial alerts
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(3);
      if (data) setRecentAlerts(data as Array<{
        timestamp: number;
        ai_fire_detected: boolean;
      }>);
    };
  
    fetchAlerts();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{name}</Text>
        </View>
        <View style={styles.profilePlaceholder}>
          <Text style={styles.profilePlaceholderText}>
            {getUserInitial()}
          </Text>
        </View>
      </View>

      <View style={styles.temperatureContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Loading weather...</Text>
        ) : error ? (
          <Text style={styles.errorText}>Weather data unavailable</Text>
        ) : (
          <>
            <Text style={styles.temperature}>
              {weather.emoji} {weather.temperature}°C
            </Text>
            <Text style={styles.temperatureLabel}>{weather.condition}</Text>
          </>
        )}
      </View>

      <View style={styles.gridContainer}>
        <View style={[styles.bentoBox, systemStatus.operational ? styles.healthyBox : styles.unhealthyBox]}>
          <Text style={styles.boxTitle}>System Health</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: systemStatus.operational ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.statusText}>
              {systemStatus.operational ? 'All systems operational' : 'System issues detected'}
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: systemStatus.networkConnected ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.statusText}>
              Network: {systemStatus.networkConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <Text style={styles.lastCheck}>
            Last checked: {systemStatus.lastCheck.toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.bentoBox}>
          <Text style={styles.boxTitle}>Recent Alerts</Text>
          {recentAlerts.length > 0 ? (
            recentAlerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: alert.ai_fire_detected ? '#f44336' : '#FFA726' }]} />
                <Text style={styles.alertText} numberOfLines={1}>
                  {alert.ai_fire_detected ? 'Fire' : 'Smoke'} detected
                </Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noAlertsText}>No recent alerts</Text>
          )}
        </View>

        <View style={styles.mapBentoBox}>
          <MapView
            style={styles.map}
            region={region}
          >
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title={"Your Location"} />
          </MapView>
        </View>

        <View style={styles.bentoBox}>
          <Text style={styles.boxTitle}>System Analytics</Text>
          <View style={styles.analyticsContainer}>
            <Text style={styles.analyticsValue}>24/7</Text>
            <Text style={styles.analyticsLabel}>Monitoring</Text>
          </View>
          <View style={styles.analyticsContainer}>
            <Text style={styles.analyticsValue}>{recentAlerts.length}</Text>
            <Text style={styles.analyticsLabel}>Today's Alerts</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Update the container style to adjust padding and content positioning
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50, // Reduced from 60
    paddingBottom: 120, // Increased from 80 to account for tab bar
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: '#333',
  },
  username: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
  },
  temperatureContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20, // Reduced from 50
    alignItems: 'center',
  },
  temperature: {
    fontSize: 48,
    fontWeight: '600',
    color: '#333',
  },
  temperatureLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20, // Added margin bottom
  },
  bentoBox: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12, // Reduced from 15
    minHeight: 140, // Reduced from 150
  },
  mapBentoBox: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    color: '#333',
    paddingHorizontal: 0,
    paddingTop: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E26964',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  healthyBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  unhealthyBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  lastCheck: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  noAlertsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  analyticsContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});