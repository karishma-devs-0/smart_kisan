import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture } from '../api/profileEnhancements';

export default function ProfilePictureUpload({ visible, onClose, userId, onSuccess }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const defaultAvatars = [
    { id: 1, emoji: '💪', color: '#E53935' },
    { id: 2, emoji: '🏋️', color: '#44bd32' },
    { id: 3, emoji: '🔥', color: '#f39c12' },
    { id: 4, emoji: '⚡', color: '#8e44ad' },
    { id: 5, emoji: '🎯', color: '#0097e6' },
    { id: 6, emoji: '🏆', color: '#27ae60' },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpload = async (imageUrl) => {
    setUploading(true);
    try {
      await uploadProfilePicture(userId, imageUrl);
      onSuccess(imageUrl);
      onClose();
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const selectDefaultAvatar = (avatar) => {
    const avatarUrl = `avatar_${avatar.id}_${avatar.emoji}`;
    handleUpload(avatarUrl);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Profile Picture</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Take or Upload Photo</Text>
              <View style={styles.photoOptions}>
                <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color="#0097e6" />
                  <Text style={styles.photoOptionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
                  <Ionicons name="images" size={32} color="#0097e6" />
                  <Text style={styles.photoOptionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedImage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preview</Text>
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleUpload(selectedImage)}
                    disabled={uploading}
                  >
                    <Text style={styles.uploadButtonText}>
                      {uploading ? 'Uploading...' : 'Use This Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Default Avatar</Text>
              <View style={styles.avatarGrid}>
                {defaultAvatars.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[styles.avatarOption, { backgroundColor: avatar.color }]}
                    onPress={() => selectDefaultAvatar(avatar)}
                    disabled={uploading}
                  >
                    <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  photoOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  photoOption: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: '45%',
  },
  photoOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#0097e6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarEmoji: {
    fontSize: 24,
  },
});