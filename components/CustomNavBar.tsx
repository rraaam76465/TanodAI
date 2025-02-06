import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CustomNavBar = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('index');
  const [notificationCount, setNotificationCount] = useState(2); // Initial count

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'index') {
      router.replace('/(dashboard)/');
    } else {
      router.replace(`/(dashboard)/${tab}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={[
            styles.tabContainer,
            activeTab === 'index' && styles.activeTab
          ]}
          onPress={() => handleTabPress('index')}
        >
          <Ionicons 
            name="home"
            size={24} 
            color={activeTab === 'index' ? '#333' : '#666'}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tabContainer,
            activeTab === 'notifications' && styles.activeTab
          ]}
          onPress={() => handleTabPress('notifications')}
        >
          <View>
            <Ionicons 
              name="notifications"
              size={24} 
              color={activeTab === 'notifications' ? '#333' : '#666'}
            />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tabContainer,
            activeTab === 'profile' && styles.activeTab
          ]}
          onPress={() => handleTabPress('profile')}
        >
          <Ionicons 
            name="person"
            size={24} 
            color={activeTab === 'profile' ? '#333' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  tabContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#f0f0f0',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E26964',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CustomNavBar; 