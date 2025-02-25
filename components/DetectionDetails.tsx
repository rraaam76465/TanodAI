import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DetectionDetailsProps {
  visible: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  onIgnore: () => void;
  data: {
    cameraName?: string;
    cameraIp?: string;
    address?: string;
    date?: string;
    time?: string;
    image_url?: string;
  };
}

export const DetectionDetails = ({ visible, onClose, onAcknowledge, onIgnore, data }: DetectionDetailsProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            {data?.image_url ? (
              <Image 
                source={{ uri: data.image_url }} 
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <Text style={styles.timestamp}>{data?.time || "11:48 PM"}</Text>
          </View>

          <Text style={styles.title}>Detection Details</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.label}>Camera Name:</Text>
              <Text style={styles.value}>{data?.cameraName || "Camera 1"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="wifi" size={20} color="#fff" />
              <Text style={styles.label}>Camera IP:</Text>
              <Text style={styles.value}>{data?.cameraIp || "1"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{data?.address || "Not specified"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{data?.date || "04.02.2022"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#fff" />
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{data?.time || "11:00"}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.acknowledgeButton]} 
              onPress={onAcknowledge}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.buttonText}>Acknowledge</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.ignoreButton]} 
              onPress={onIgnore}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.buttonText}>Ignore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  imageContainer: {
    height: 250,
    marginTop: 30,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  timestamp: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 5,
    borderRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 20,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    marginLeft: 10,
    marginRight: 5,
    opacity: 0.8,
  },
  value: {
    color: '#fff',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
  },
  acknowledgeButton: {
    backgroundColor: '#4CAF50',
  },
  ignoreButton: {
    backgroundColor: '#E26964',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '600',
  },
});