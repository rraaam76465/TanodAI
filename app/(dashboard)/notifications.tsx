import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([
    { id: '1', message: 'New message' },
    { id: '2', message: 'System update' },
  ]);

  const handleClearNotifications = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            navigation.setOptions({
              headerRight: () => null,
            });
            // Update the badge in the navbar
            navigation.setParams({ notificationCount: 0 });
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearNotifications}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )
      ),
    });
  }, [navigation, notifications]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Notifications</Text>
        <TouchableOpacity style={styles.profilePic}>
          <View style={styles.avatar} />
        </TouchableOpacity>
      </View>

      {/* Alert Card */}
      <View style={styles.alertCard}>
        <View style={styles.alertIconContainer}>
          <Ionicons name="warning" size={24} color="black" />
        </View>
        <Text style={styles.alertTitle}>Smoke alarm triggered</Text>
        <Text style={styles.alertTime}>Yesterday - 10:15 am</Text>
        
        {/* Circular Animation View */}
        <View style={styles.circularAnimation}>
          <View style={[styles.circle, styles.circle4]} />
          <View style={[styles.circle, styles.circle3]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle1]} />
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>See Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dismissButton}>
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
      </View>

      {/* Latest Events Section */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>Latest events</Text>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>{item.message}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={40} color="#666" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

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
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#bbb',
  },
  alertCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffeeee',
    borderRadius: 15,
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  alertTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  circularAnimation: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
  },
  circle1: {
    width: 60,
    height: 60,
    backgroundColor: '#ff0000',
  },
  circle2: {
    width: 100,
    height: 100,
    backgroundColor: '#ff000080',
  },
  circle3: {
    width: 140,
    height: 140,
    backgroundColor: '#ff000040',
  },
  circle4: {
    width: 180,
    height: 180,
    backgroundColor: '#ff000020',
  },
  detailsButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsButtonText: {
    fontWeight: '600',
  },
  dismissButton: {
    width: '100%',
    padding: 15,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#666',
  },
  eventsSection: {
    padding: 20,
  },
  eventsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    marginRight: 15,
  },
  clearButtonText: {
    color: '#E26964',
    fontSize: 16,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
}); 