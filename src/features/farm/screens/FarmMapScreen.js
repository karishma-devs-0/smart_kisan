import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, TAB_BAR, SHADOWS } from '../../../constants/layout';
import { MOCK_DEVICE_TYPES } from '../../devices/mock/devicesMockData';
import { fetchFields, addField, removeField } from '../../fields/slice/fieldsSlice';
import { fetchDevices, addDevice, removeDevice } from '../../devices/slice/devicesSlice';
import { generateMapHTML } from '../../../utils/leafletMap';

const DEVICE_TYPE_OPTIONS = Object.entries(MOCK_DEVICE_TYPES).map(([key, val]) => ({
  type: key,
  label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  ...val,
}));

const CROP_ICONS = {
  Wheat: 'barley',
  'Bell Pepper': 'chili-mild',
  Cotton: 'flower',
  Tomato: 'food-apple',
  Soybean: 'seed',
};

const CROP_OPTIONS = ['Wheat', 'Bell Pepper', 'Cotton', 'Tomato', 'Soybean'];

const FarmMapScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const fields = useSelector((state) => state.fields.fields);
  const devices = useSelector((state) => state.devices.devices);
  const webViewRef = useRef(null);

  const [editMode, setEditMode] = useState(null); // null | 'addDevice' | 'addField'
  const [tappedLocation, setTappedLocation] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('moisture_sensor');
  const [fieldName, setFieldName] = useState('');
  const [fieldCrop, setFieldCrop] = useState('Wheat');
  const [fieldArea, setFieldArea] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    dispatch(fetchFields());
    dispatch(fetchDevices());
  }, [dispatch]);

  // Debounced geocoding search via Photon (better fuzzy search than Nominatim)
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=6&lang=en`
        );
        const data = await res.json();
        setSearchResults((data.features || []).map((f, i) => {
          const p = f.properties;
          const parts = [p.name, p.city, p.state, p.country].filter(Boolean);
          return {
            id: `${f.properties.osm_id || i}`,
            name: parts.join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          };
        }));
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectResult = useCallback((result) => {
    setSearchQuery(result.name.split(',')[0]);
    setShowResults(false);
    setSearchResults([]);
    Keyboard.dismiss();
    // Fly the map to the selected location via injectJavaScript
    const js = `map.flyTo([${result.lat}, ${result.lng}], 14, { duration: 1.5 }); true;`;
    webViewRef.current?.injectJavaScript(js);
  }, []);

  const handleClearAll = useCallback(() => {
    if (!devices.length && !fields.length) {
      Alert.alert('Nothing to Clear', 'No fields or devices to remove.');
      return;
    }
    Alert.alert(
      'Clear All',
      `Remove all ${fields.length} field(s) and ${devices.length} device(s) from the map?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            devices.forEach((d) => dispatch(removeDevice(d.id)));
            fields.forEach((f) => dispatch(removeField(f.id)));
            // Clear all layers from the map except tile layers
            webViewRef.current?.injectJavaScript(`
              map.eachLayer(function(layer) {
                if (!(layer instanceof L.TileLayer)) {
                  map.removeLayer(layer);
                }
              });
              true;
            `);
          },
        },
      ]
    );
  }, [devices, fields, dispatch]);

  const isPlacing = editMode !== null;

  // Generate map HTML only once on initial load — all updates happen via injectJavaScript
  const initialFieldsRef = useRef(null);
  const initialDevicesRef = useRef(null);
  if (initialFieldsRef.current === null) initialFieldsRef.current = fields;
  if (initialDevicesRef.current === null) initialDevicesRef.current = devices;

  const mapHTML = useMemo(() => {
    return generateMapHTML({
      fields: initialFieldsRef.current,
      devices: initialDevicesRef.current,
      interactive: true, zoom: 15, tapToPlace: false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inject / remove tap-to-place listener when edit mode changes (no WebView reload)
  useEffect(() => {
    if (!webViewRef.current) return;
    if (isPlacing) {
      webViewRef.current.injectJavaScript(`
        if (!window._placementHandler) {
          window._placementMarker = null;
          window._placementHandler = function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            if (window._placementMarker) {
              window._placementMarker.setLatLng(e.latlng);
            } else {
              window._placementMarker = L.marker(e.latlng, {
                icon: L.divIcon({
                  className: 'placement-pin',
                  html: '<div style="width:32px;height:32px;background:#4CAF50;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div></div>',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })
              }).addTo(map);
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tapLocation', lat: lat, lng: lng }));
          };
          map.on('click', window._placementHandler);
        }
        true;
      `);
    } else {
      webViewRef.current.injectJavaScript(`
        if (window._placementHandler) {
          map.off('click', window._placementHandler);
          window._placementHandler = null;
          if (window._placementMarker) {
            map.removeLayer(window._placementMarker);
            window._placementMarker = null;
          }
        }
        true;
      `);
    }
  }, [isPlacing]);

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const tabBarPadding = TAB_BAR.height + TAB_BAR.marginBottom + Math.max(insets.bottom, 12) + 8;

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'tapLocation') {
        setTappedLocation({ lat: data.lat, lng: data.lng });
        setShowForm(true);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  const resetEditState = () => {
    setEditMode(null);
    setTappedLocation(null);
    setShowForm(false);
    setDeviceName('');
    setDeviceType('moisture_sensor');
    setFieldName('');
    setFieldCrop('Wheat');
    setFieldArea('');
  };

  const handleSaveDevice = () => {
    if (!deviceName.trim()) {
      Alert.alert('Missing Name', 'Please enter a device name.');
      return;
    }
    if (!tappedLocation) return;
    const typeInfo = MOCK_DEVICE_TYPES[deviceType] || {};
    const iconColor = typeInfo.color || '#607D8B';
    const name = deviceName.trim();

    dispatch(addDevice({
      id: `user_${Date.now()}`,
      name,
      type: deviceType,
      status: 'online',
      batteryLevel: 100,
      lastSync: new Date().toISOString(),
      location: 'User placed',
      coordinates: tappedLocation,
      fieldId: null,
      firmwareVersion: '1.0.0',
      signalStrength: 80,
    }));

    // Inject marker into existing map
    webViewRef.current?.injectJavaScript(`
      L.circleMarker([${tappedLocation.lat}, ${tappedLocation.lng}], {
        radius: 8, fillColor: '${iconColor}', color: '#4CAF50',
        weight: 3, opacity: 1, fillOpacity: 1,
      }).addTo(map)
        .bindPopup('<b>${name.replace(/'/g, "\\'")}</b><br><span style="color:#4CAF50">● Online</span><br>Battery: 100%');
      true;
    `);
    resetEditState();
  };

  const handleSaveField = () => {
    if (!fieldName.trim()) {
      Alert.alert('Missing Name', 'Please enter a field name.');
      return;
    }
    if (!tappedLocation) return;
    const name = fieldName.trim();
    const shortName = name.split(' - ')[0];

    dispatch(addField({
      id: `field_${Date.now()}`,
      name,
      area: parseFloat(fieldArea) || 1.0,
      crop: fieldCrop,
      sowingDate: new Date().toISOString(),
      growthStage: 'seedling',
      growthProgress: 5,
      soilType: 'Loamy',
      irrigationType: 'drip',
      lastIrrigation: new Date().toISOString(),
      nextIrrigation: new Date().toISOString(),
      status: 'active',
      location: tappedLocation,
    }));

    // Inject marker into existing map
    webViewRef.current?.injectJavaScript(`
      L.circleMarker([${tappedLocation.lat}, ${tappedLocation.lng}], {
        radius: 14, fillColor: '#4CAF50', color: '#fff',
        weight: 3, opacity: 1, fillOpacity: 0.85,
      }).addTo(map)
        .bindPopup('<b>${name.replace(/'/g, "\\'")}</b><br>${fieldCrop} · ${parseFloat(fieldArea) || 1.0} acres<br>Growth: 5%', { closeButton: false })
        .bindTooltip('${shortName.replace(/'/g, "\\'")}', { permanent: true, direction: 'bottom', offset: [0, 10], className: 'field-label' });
      true;
    `);
    resetEditState();
  };

  const legendItems = DEVICE_TYPE_OPTIONS;

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {mapHTML ? (
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
            onMessage={handleWebViewMessage}
          />
        ) : (
          <View style={styles.loadingMap}>
            <MaterialCommunityIcons name="map-search" size={48} color={COLORS.textTertiary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Top bar: back + search + clear all */}
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { if (editMode) resetEditState(); else navigation.goBack(); }}
        >
          <MaterialCommunityIcons name={editMode ? 'close' : 'arrow-left'} size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {!isPlacing && (
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => searchResults.length && setShowResults(true)}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color={COLORS.primaryLight} style={styles.searchSpinner} />}
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }} style={styles.searchClear}>
                <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {!isPlacing && (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
            <MaterialCommunityIcons name="delete-sweep-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <View style={[styles.searchDropdown, { top: insets.top + 64 }]}>
          {searchResults.map((item) => (
            <TouchableOpacity key={item.id} style={styles.searchResultItem} onPress={() => handleSelectResult(item)}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={COLORS.primaryLight} />
              <Text style={styles.searchResultText} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tap instruction banner */}
      {isPlacing && !showForm && (
        <View style={[styles.editBanner, { top: insets.top + 64 }]}>
          <MaterialCommunityIcons name="map-marker-plus" size={18} color={COLORS.white} />
          <Text style={styles.editBannerText}>
            Tap map to place {editMode === 'addDevice' ? 'device' : 'field'}
          </Text>
        </View>
      )}

      {/* FAB buttons */}
      {!editMode && (
        <View style={[styles.fabColumn, { bottom: tabBarPadding + 220 }]}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: COLORS.primaryLight }]}
            onPress={() => setEditMode('addField')}
          >
            <MaterialCommunityIcons name="vector-square" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: '#2196F3' }]}
            onPress={() => setEditMode('addDevice')}
          >
            <MaterialCommunityIcons name="router-wireless" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom sheet (view mode only) */}
      {!editMode && (
        <View style={[styles.bottomSheet, { paddingBottom: tabBarPadding }]}>
          <View style={styles.handle} />
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="vector-square" size={16} color={COLORS.primaryLight} />
              <Text style={styles.statChipText}>{fields.length} Fields</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statChipText}>{onlineCount} Online</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.statChipText}>{offlineCount} Offline</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legendContent}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight }]} />
              <Text style={styles.legendLabel}>Field</Text>
            </View>
            {legendItems.map((item) => (
              <View key={item.type} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]}>
                  <MaterialCommunityIcons name={item.icon} size={10} color={COLORS.white} />
                </View>
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldCardsContent}>
            {fields.map((field) => (
              <TouchableOpacity key={field.id} style={styles.fieldCard} onPress={() => navigation.navigate('FieldDetail', { field })} activeOpacity={0.7}>
                <View style={styles.fieldCardTop}>
                  <View style={[styles.fieldCardIcon, { backgroundColor: (field.status === 'harvested' ? COLORS.warning : COLORS.primaryLight) + '20' }]}>
                    <MaterialCommunityIcons name={CROP_ICONS[field.crop] || 'sprout'} size={20} color={field.status === 'harvested' ? COLORS.warning : COLORS.primaryLight} />
                  </View>
                  <Text style={styles.fieldCardName} numberOfLines={1}>{field.name}</Text>
                </View>
                <Text style={styles.fieldCardCrop}>{field.crop}</Text>
                <View style={styles.fieldCardBottom}>
                  <Text style={styles.fieldCardArea}>{field.area} acres</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${field.growthProgress}%`, backgroundColor: field.status === 'harvested' ? COLORS.warning : COLORS.primaryLight }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Add Device Form ── */}
      <Modal visible={showForm && editMode === 'addDevice'} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.formSheet}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add Smart Device</Text>
              <TouchableOpacity onPress={resetEditState}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {tappedLocation && (
              <View style={styles.coordRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.primaryLight} />
                <Text style={styles.coordText}>{tappedLocation.lat.toFixed(5)}, {tappedLocation.lng.toFixed(5)}</Text>
              </View>
            )}

            <Text style={styles.formLabel}>Device Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Field A Moisture Sensor" placeholderTextColor={COLORS.textTertiary} value={deviceName} onChangeText={setDeviceName} />

            <Text style={styles.formLabel}>Device Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {DEVICE_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  style={[styles.typeChip, deviceType === opt.type && { backgroundColor: opt.color + '20', borderColor: opt.color }]}
                  onPress={() => setDeviceType(opt.type)}
                >
                  <MaterialCommunityIcons name={opt.icon} size={18} color={deviceType === opt.type ? opt.color : COLORS.textSecondary} />
                  <Text style={[styles.typeChipText, deviceType === opt.type && { color: opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveDevice}>
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Place Device</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Field Form ── */}
      <Modal visible={showForm && editMode === 'addField'} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.formSheet}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add Field</Text>
              <TouchableOpacity onPress={resetEditState}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {tappedLocation && (
              <View style={styles.coordRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.primaryLight} />
                <Text style={styles.coordText}>{tappedLocation.lat.toFixed(5)}, {tappedLocation.lng.toFixed(5)}</Text>
              </View>
            )}

            <Text style={styles.formLabel}>Field Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Field F - West" placeholderTextColor={COLORS.textTertiary} value={fieldName} onChangeText={setFieldName} />

            <Text style={styles.formLabel}>Crop</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {CROP_OPTIONS.map((crop) => (
                <TouchableOpacity
                  key={crop}
                  style={[styles.cropChip, fieldCrop === crop && styles.cropChipActive]}
                  onPress={() => setFieldCrop(crop)}
                >
                  <MaterialCommunityIcons name={CROP_ICONS[crop] || 'sprout'} size={16} color={fieldCrop === crop ? COLORS.primaryLight : COLORS.textSecondary} />
                  <Text style={[styles.cropChipText, fieldCrop === crop && styles.cropChipTextActive]}>{crop}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>Area (acres)</Text>
            <TextInput style={styles.input} placeholder="e.g. 3.5" placeholderTextColor={COLORS.textTertiary} value={fieldArea} onChangeText={setFieldArea} keyboardType="decimal-pad" />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveField}>
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Add Field</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  loadingMap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textTertiary },
  topBar: {
    position: 'absolute', left: SPACING.md, right: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, zIndex: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 20, height: 40,
    paddingHorizontal: SPACING.sm, ...SHADOWS.md,
  },
  searchIcon: { marginRight: SPACING.xs },
  searchInput: {
    flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary,
    paddingVertical: 0, height: 40,
  },
  searchSpinner: { marginLeft: SPACING.xs },
  searchClear: { marginLeft: SPACING.xs, padding: 2 },
  clearAllButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
  },
  searchDropdown: {
    position: 'absolute', left: SPACING.md + 48, right: SPACING.md + 48, zIndex: 20,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, ...SHADOWS.lg,
    maxHeight: 240, overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  searchResultText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  editBanner: {
    position: 'absolute', alignSelf: 'center', zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, ...SHADOWS.md,
  },
  editBannerText: { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  fabColumn: { position: 'absolute', right: SPACING.lg, gap: SPACING.md },
  fab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: SPACING.sm, paddingHorizontal: SPACING.lg, ...SHADOWS.lg,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.divider, alignSelf: 'center', marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, gap: SPACING.xs,
  },
  statChipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  legendContent: { gap: SPACING.sm, paddingBottom: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  legendLabel: { fontSize: 10, color: COLORS.textTertiary, fontWeight: FONT_WEIGHTS.medium },
  fieldCardsContent: { gap: SPACING.md, paddingBottom: SPACING.sm },
  fieldCard: { width: 140, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md },
  fieldCardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  fieldCardIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fieldCardName: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  fieldCardCrop: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  fieldCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldCardArea: { fontSize: 10, color: COLORS.textTertiary, fontWeight: FONT_WEIGHTS.medium },
  progressBarBg: { width: 40, height: 3, borderRadius: 2, backgroundColor: COLORS.divider },
  progressBarFill: { height: 3, borderRadius: 2 },

  // Modal form
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  formSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  formTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  coordRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.lg,
  },
  coordText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  formLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginBottom: SPACING.lg,
  },
  typeScroll: { marginBottom: SPACING.lg },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm,
  },
  typeChipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  cropChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm,
  },
  cropChipActive: { backgroundColor: COLORS.primaryLight + '20', borderColor: COLORS.primaryLight },
  cropChipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  cropChipTextActive: { color: COLORS.primaryLight },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, marginTop: SPACING.sm,
  },
  saveButtonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
});

export default FarmMapScreen;
