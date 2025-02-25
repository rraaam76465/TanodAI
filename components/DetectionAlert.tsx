import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DetectionAlertProps {
  visible: boolean;
  onClose: () => void;
  data: any;
  image: string;
}

export const DetectionAlert: React.FC<DetectionAlertProps> = ({ visible, onClose, data, image }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            {image ? (
              <Image 
                source={{ uri: image }} 
                style={styles.detectionImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <Text style={styles.timestamp}>{data?.time || new Date().toLocaleTimeString()}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detection Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.detailLabel}>Camera Name:</Text>
              <Text style={styles.detailValue}>{data?.cameraName || "Camera 1"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#fff" />
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{data?.date || new Date().toLocaleDateString()}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.acknowledgeButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    margin: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 10,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  detectionImage: {
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
  detailsContainer: {
    padding: 20,
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    color: '#fff',
    marginLeft: 10,
    marginRight: 5,
  },
  detailValue: {
    color: '#fff',
    opacity: 0.8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeButton: {
    backgroundColor: '#E26964',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});