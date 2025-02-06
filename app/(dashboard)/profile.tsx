import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.raw_user_meta_data?.name || 'User');
  const [isSoundDropdownOpen, setIsSoundDropdownOpen] = useState(false);

  useEffect(() => {
    if (user?.raw_user_meta_data?.name) {
      setName(user.raw_user_meta_data.name);
    }
  }, [user]);

  const getUserInitial = () => {
    return user?.user_metadata?.firstName?.charAt(0) || 'U';
  };

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setIsLoading(true);
        // Here you can handle the image if you want to store it locally
        // but we won't upload it to Supabase
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        data: { name },
      });

      if (error) throw error;

      // Refresh the session to ensure the changes are reflected
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // Update the local state with the new metadata
      setName(updatedUser?.raw_user_meta_data?.name || name);
      Alert.alert('Success', 'Name updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSoundAlert = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/alert.mp3') // Add a sound file in your assets
    );
    await sound.playAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {/* Profile Picture Section */}
      <TouchableOpacity 
        style={styles.profilePictureContainer} 
        onPress={handleImageUpload}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#E26964" />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profilePlaceholderText}>
              {getUserInitial()}
            </Text>
          </View>
        )}
        {!isLoading && (
          <View style={styles.uploadIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Information */}
      <View style={styles.profileInfo}>
        <Text style={styles.label}>Name:</Text>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateName}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.value}>{name}</Text>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={20} color="#E26964" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => setIsSoundDropdownOpen(!isSoundDropdownOpen)}
        >
          <Ionicons name="notifications" size={24} color="#666" />
          <Text style={styles.settingText}>Notification Settings</Text>
          <Ionicons 
            name={isSoundDropdownOpen ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {isSoundDropdownOpen && (
          <TouchableOpacity 
            style={styles.dropdownItem}
            onPress={handleTestSoundAlert}
          >
            <Ionicons name="volume-high" size={20} color="#666" />
            <Text style={styles.dropdownText}>Test Sound Alert</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="lock-closed" size={24} color="#666" />
          <Text style={styles.settingText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle" size={24} color="#666" />
          <Text style={styles.settingText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E26964',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
  },
  uploadIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E26964',
    borderRadius: 20,
    padding: 5,
  },
  profileInfo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    marginBottom: 15,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#E26964',
    padding: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginLeft: 10,
  },
  settingsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E26964',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 40,
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 16,
  },
}); 