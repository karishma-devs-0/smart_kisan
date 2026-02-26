import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { addCrop } from '../slice/cropsSlice';

const AddCropScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { Alert.alert('Error', 'Plant name is required'); return; }
    dispatch(addCrop({ name: name.trim(), variety: variety.trim(), sowingDate: new Date().toISOString().split('T')[0], status: 'growing' }));
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Plant</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.imagePicker} onPress={() => Alert.alert('Image Picker', 'Camera/gallery would open here')}>
          <View style={styles.imageIcon}><MaterialCommunityIcons name="camera" size={32} color={COLORS.textSecondary} /></View>
          <Text style={styles.imageText}>Add photo</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Plant name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter plant name" placeholderTextColor={COLORS.textTertiary} />
        <Text style={styles.label}>Variety</Text>
        <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="Enter variety" placeholderTextColor={COLORS.textTertiary} />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}><Text style={styles.createText}>Create</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  closeBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  title: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  imagePicker: { height: 150, borderRadius: BORDER_RADIUS.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl },
  imageIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  imageText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  label: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  input: { height: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  buttonRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary },
  createBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary },
  createText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default AddCropScreen;
