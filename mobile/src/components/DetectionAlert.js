import React from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const DetectionAlert = ({ visible, onClose, data, image }) => {
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
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {image && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: image }} 
                style={styles.detectionImage}
                resizeMode="cover"
              />
              <Text style={styles.timestamp}>{data?.timestamp || "11:48 PM"}</Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detection Details</Text>
            
            <View style={styles.detailRow}>
              <Icon name="camera" size={20} color="#fff" />
              <Text style={styles.detailLabel}>Camera Name:</Text>
              <Text style={styles.detailValue}>{data?.cameraName || "Camera 1"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="camera" size={20} color="#fff" />
              <Text style={styles.detailLabel}>Camera IP:</Text>
              <Text style={styles.detailValue}>{data?.cameraIp || "1"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="map-marker" size={20} color="#fff" />
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{data?.address || ""}</Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="calendar" size={20} color="#fff" />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{data?.date || new Date().toLocaleDateString()}</Text>
              <Icon name="clock-outline" size={20} color="#fff" style={styles.timeIcon} />
              <Text style={styles.detailValue}>{data?.time || new Date().toLocaleTimeString()}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.acknowledgeButton]}
                onPress={() => {
                  if (data?.onAcknowledge) data.onAcknowledge();
                  onClose();
                }}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.buttonText}>Acknowledge</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.ignoreButton]}
                onPress={() => {
                  if (data?.onIgnore) data.onIgnore();
                  onClose();
                }}
              >
                <Icon name="close" size={20} color="#fff" />
                <Text style={styles.buttonText}>Ignore</Text>
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
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  imageContainer: {
    height: '40%',
    width: '100%',
    position: 'relative',
  },
  detectionImage: {
    width: '100%',
    height: '100%',
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
  timeIcon: {
    marginLeft: 15,
    marginRight: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  acknowledgeButton: {
    backgroundColor: '#4CAF50',
  },
  ignoreButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
});