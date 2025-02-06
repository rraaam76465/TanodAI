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

const { width } = Dimensions.get('window');

interface User {
  user_metadata?: {
    firstName?: string;
  };
}

export default function DashboardScreen() {
  const { user } = useAuth() as User;
  console.log('User Object:', user);
  const { weather, loading, error } = useWeather();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('User');
  const [region, setRegion] = useState({
    latitude: 37.78825, // Default fallback
    longitude: -122.4324, // Default fallback
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

  return (
    <View style={styles.container}>
      {/* Dashboard Content */}
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

      {/* Temperature Section */}
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

      {/* Bento Boxes Grid */}
      <View style={styles.gridContainer}>
        {/* System Health */}
        <View style={styles.bentoBox}>
          <Text style={styles.boxTitle}>System Health</Text>
          <Text>All systems operational</Text>
        </View>

        {/* Recent Alerts */}
        <View style={styles.bentoBox}>
          <Text style={styles.boxTitle}>Recent Alerts</Text>
          <Text>No recent alerts</Text>
        </View>

        {/* Map */}
        <View style={styles.mapBentoBox}>
          <MapView
            style={styles.map}
            region={region}
          >
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title={"Your Location"} />
          </MapView>
        </View>

        {/* Placeholder */}
        <View style={styles.bentoBox}>
          <Text style={styles.boxTitle}>Feature 2</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 120,
    paddingBottom: 100,
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
    marginBottom:50,
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
  },
  bentoBox: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    minHeight: 150,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
    paddingHorizontal: 15,
    paddingTop: 15,
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
}); 