import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '@/hooks/useAuth';
import { useWeather } from '@/hooks/useWeather';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Geolocation from 'react-native-geolocation-service';
import { DetectionAlert } from '@/components/DetectionAlert';

const { width } = Dimensions.get('window');

interface SensorReading {
  id: number;
  timestamp: string;
  ai_fire_detected: boolean;
  smoke_detected: boolean;
}

interface AuthState {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      firstName?: string;
      name?: string;
    };
  } | null;
}

interface UserMetadata {
    firstName?: string;
    name?: string;
}

export default function DashboardScreen() {
  const { user: authUser } = useAuth() as AuthState;
  const { weather, loading, error } = useWeather();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(authUser?.user_metadata?.name || authUser?.user_metadata?.firstName || 'User');
  const [systemStatus, setSystemStatus] = useState({
    operational: false,
    networkConnected: true,
    lastCheck: new Date(),
  });

  useEffect(() => {
    const checkDeviceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('sensor_readings')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        const isRecent = data?.[0] && 
          (new Date().getTime() - new Date(data[0].timestamp).getTime()) < 60000;
        
        setSystemStatus(current => ({
          ...current,
          operational: Boolean(data?.[0]),
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
    
    checkDeviceStatus();

    const interval = setInterval(checkDeviceStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const [recentAlerts, setRecentAlerts] = useState<SensorReading[]>([]);

  // Add back the Supabase subscription useEffect for real-time updates
  useEffect(() => {
    // Fetch initial alerts
    const fetchInitialAlerts = async () => {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(3); // Fetch last 3
      if (error) {
          console.error("Error fetching initial alerts:", error);
      } else if (data) {
          setRecentAlerts(data as SensorReading[]);
      }
    };

    fetchInitialAlerts();

    // Set up real-time subscription
    const sensorReadingsChannel = supabase
      .channel('dashboard-sensor-readings') // Unique channel name
      .on<SensorReading>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          console.log('New reading received:', payload.new);
          const newAlert = payload.new as SensorReading;
          setRecentAlerts(currentAlerts => 
            [newAlert, ...currentAlerts].slice(0, 3) // Add new alert and keep only 3
          );
          // Optionally update system status based on new alert
          setSystemStatus(current => ({
            ...current,
            operational: !(newAlert.ai_fire_detected || newAlert.smoke_detected), // Example logic
            networkConnected: true, // Assume connected if we received an update
            lastCheck: new Date(),
          }));
        }
      )
      .subscribe((status, err) => {
         if (err) {
            console.error("Supabase subscription error:", err);
         } else {
            console.log("Supabase subscription status:", status);
         }
      });

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(sensorReadingsChannel);
      console.log("Removed Supabase channel");
    };
  }, []); // Empty dependency array means this runs once on mount

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const getUserInitial = () => {
    const userMetadata = authUser?.user_metadata as UserMetadata | undefined;
    return userMetadata?.name?.charAt(0) || userMetadata?.firstName?.charAt(0) || 'U';
  };

  useEffect(() => {
    const fetchLocation = async () => {
      Geolocation.requestAuthorization('whenInUse').then(result => {
          if (result === 'granted') {
              Geolocation.getCurrentPosition(
                  (position) => {
                      setRegion({
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                          latitudeDelta: 0.015,
                          longitudeDelta: 0.0121,
                      });
                  },
                  (error) => {
                      Alert.alert('Location Error', error.message);
                      console.log(error.code, error.message);
                  },
                  { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
              );
          } else {
              Alert.alert('Permission denied', 'Location permission is required to show the map.');
          }
      });
    };

    fetchLocation();
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
            recentAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={[styles.alertDot, { backgroundColor: alert.ai_fire_detected ? '#f44336' : (alert.smoke_detected ? '#FFA726' : '#9E9E9E') }]} />
                <Text style={styles.alertText} numberOfLines={1}>
                  {alert.ai_fire_detected ? 'Fire' : (alert.smoke_detected ? 'Smoke' : 'Sensor')} detected
                </Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <Text style={styles.analyticsLabel}>Recent Alerts</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 120,
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  bentoBox: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    minHeight: 140,
  },
  mapBentoBox: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    overflow: 'hidden',
    aspectRatio: 1,
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: Colors.light.tint,
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
    marginTop: 'auto',
    paddingTop: 8,
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
    marginRight: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  noAlertsText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  analyticsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
  },
});