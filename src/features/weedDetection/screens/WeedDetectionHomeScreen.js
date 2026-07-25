import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchFields } from '../../fields/slice/fieldsSlice';

// Map HTML template generator with satellite, camera grid nodes, active scans, and simple heatmap overlay.
const generateWeedMapHTML = (startLat, startLng, cameraPoles) => {
  const polesJSON = JSON.stringify(cameraPoles);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0B120C; }
    .leaflet-bar { border: 1px solid #1F3321 !important; }
    .leaflet-bar a {
      background-color: #121C13 !important;
      color: #E8F5E9 !important;
      border-bottom: 1px solid #1F3321 !important;
    }
    .leaflet-bar a:hover {
      background-color: #1F3321 !important;
    }
    .camera-label {
      background: rgba(12,20,14,0.9) !important;
      border: 1px solid #1B3020 !important;
      color: #E8F5E9 !important;
      font-size: 8px !important;
      font-weight: 700 !important;
      padding: 2px 4px !important;
      border-radius: 4px !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.5) !important;
    }
    .camera-label::before { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${startLat}, ${startLng}],
      zoom: 18,
      zoomControl: true,
      attributionControl: false
    });

    // Satellite tile layer (Esri World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    }).addTo(map);

    // Labels overlay
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.5
    }).addTo(map);

    var cameraPoles = ${polesJSON};
    var cameraMarkers = {};

    // Group layers
    var gogGroup = L.layerGroup().addTo(map);
    var yogGroup = L.layerGroup().addTo(map);
    var heatmapGroup = L.layerGroup().addTo(map);
    var gridGroup = L.layerGroup().addTo(map);

    // Plot Camera Poles and Grid connections
    var poleCoords = [];
    cameraPoles.forEach(function(pole) {
      poleCoords.push([pole.lat, pole.lng]);
      
      // Default Camera marker: circle
      var marker = L.circleMarker([pole.lat, pole.lng], {
        radius: 8,
        fillColor: '#1B5E20',
        color: '#E8F5E9',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(gridGroup);

      marker.bindTooltip(pole.name.split(' ')[0] + ' ' + pole.name.split(' ')[1], {
        permanent: true,
        direction: 'bottom',
        offset: [0, 8],
        className: 'camera-label'
      });

      cameraMarkers[pole.id] = marker;
    });

    // Connect poles with a thin grid polyline
    if (poleCoords.length > 1) {
      L.polyline(poleCoords.concat([poleCoords[0]]), {
        color: '#81C784',
        weight: 1.5,
        opacity: 0.4,
        dashArray: '3, 6'
      }).addTo(gridGroup);
    }

    if (poleCoords.length > 0) {
      map.fitBounds(L.polyline(poleCoords).getBounds(), { padding: [30, 30] });
    }

    // Update active scanning camera state and fly map to it
    window.setActiveCamera = function(cameraId) {
      var activePole = null;
      cameraPoles.forEach(function(pole) {
        var marker = cameraMarkers[pole.id];
        if (marker) {
          if (pole.id === cameraId) {
            activePole = pole;
            marker.setStyle({
              fillColor: '#2196F3',
              color: '#BBDEFB',
              weight: 3.5,
              radius: 11
            });
          } else {
            marker.setStyle({
              fillColor: '#1B5E20',
              color: '#E8F5E9',
              weight: 2,
              radius: 8
            });
          }
        }
      });

      // Fly map to active pole and zoom in close
      if (activePole) {
        map.flyTo([activePole.lat, activePole.lng], 19, {
          animate: true,
          duration: 1.2
        });
      }
    };

    window.addWeedHit = function(lat, lng, type, cameraId) {
      var color = type === 'gog' ? '#E57373' : '#FFD54F';
      var grp = type === 'gog' ? gogGroup : yogGroup;

      // Small target marker
      L.circle([lat, lng], {
        radius: 0.8,
        color: color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 1.5
      }).addTo(grp);

      // Heatmap glow around coordinate
      L.circle([lat, lng], {
        radius: 10,
        stroke: false,
        fillColor: type === 'gog' ? '#D32F2F' : '#FFB300',
        fillOpacity: 0.12
      }).addTo(heatmapGroup);
    };

    window.toggleLayer = function(layerName, isVisible) {
      if (layerName === 'gog') {
        if (isVisible) map.addLayer(gogGroup);
        else map.removeLayer(gogGroup);
      } else if (layerName === 'yog') {
        if (isVisible) map.addLayer(yogGroup);
        else map.removeLayer(yogGroup);
      } else if (layerName === 'heatmap') {
        if (isVisible) map.addLayer(heatmapGroup);
        else map.removeLayer(heatmapGroup);
      } else if (layerName === 'path') {
        if (isVisible) map.addLayer(gridGroup);
        else map.removeLayer(gridGroup);
      }
    };

    window.resetMap = function() {
      gogGroup.clearLayers();
      yogGroup.clearLayers();
      heatmapGroup.clearLayers();
      cameraPoles.forEach(function(pole) {
        var marker = cameraMarkers[pole.id];
        if (marker) {
          marker.setStyle({
            fillColor: '#1B5E20',
            color: '#E8F5E9',
            weight: 2,
            radius: 8
          });
        }
      });
      if (cameraPoles.length > 0) {
        map.fitBounds(L.polyline(poleCoords).getBounds(), { padding: [30, 30] });
      }
    };

    // React Native Communications
    document.addEventListener('message', function(e) {
      try {
        var event = JSON.parse(e.data);
        if (event.type === 'setActiveCamera') {
          window.setActiveCamera(event.id);
        } else if (event.type === 'addWeedHit') {
          window.addWeedHit(event.lat, event.lng, event.mode, event.cameraId);
        } else if (event.type === 'toggleLayer') {
          window.toggleLayer(event.layer, event.visible);
        } else if (event.type === 'reset') {
          window.resetMap();
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
  `;
};

const WeedDetectionHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const webViewRef = useRef(null);

  // Redux fields to select coordinates base
  const fields = useSelector((state) => state.fields.fields);
  const activeField = fields.length > 0 ? fields[0] : { name: 'Demo Field', location: { lat: 23.258, lng: 77.411 } };
  const fieldLat = activeField.location?.lat || 23.258;
  const fieldLng = activeField.location?.lng || 77.411;

  // Generate 6 static Camera Pole Coordinates placed around the field
  const cameraPoles = useRef([]);
  if (cameraPoles.current.length === 0) {
    cameraPoles.current = [
      { id: 1, name: 'Camera #1 (North-West)', lat: fieldLat + 0.00025, lng: fieldLng - 0.0003 },
      { id: 2, name: 'Camera #2 (North-East)', lat: fieldLat + 0.0002, lng: fieldLng + 0.0003 },
      { id: 3, name: 'Camera #3 (Center-West)', lat: fieldLat + 0.00005, lng: fieldLng - 0.0002 },
      { id: 4, name: 'Camera #4 (Center-East)', lat: fieldLat - 0.00005, lng: fieldLng + 0.0002 },
      { id: 5, name: 'Camera #5 (South-West)', lat: fieldLat - 0.0002, lng: fieldLng - 0.0003 },
      { id: 6, name: 'Camera #6 (South-East)', lat: fieldLat - 0.00025, lng: fieldLng + 0.00025 }
    ];
  }

  // Simulation speed multiplier (1x, 2x, 5x)
  const [simulationMultiplier, setSimulationMultiplier] = useState(1);

  // Modes: 'gog' (Green-on-Green) vs 'yog' (Yellow-on-Green)
  const [selectedMode, setSelectedMode] = useState('gog');
  const [selectedCrop, setSelectedCrop] = useState('Soybean');

  // Configuration settings (Sliders)
  const [speed, setSpeed] = useState(8); // Capture frequency (seconds)
  const [delay, setDelay] = useState(30); // AI Inference Latency (ms)
  const [threshold, setThreshold] = useState(75); // % confidence threshold

  // Live simulation states
  const [isSpraying, setIsSpraying] = useState(false);
  const [scannedArea, setScannedArea] = useState(0); // images scanned
  const [chemicalSaved, setChemicalSaved] = useState(98); // Field Health Index
  const [weedsDetectedCount, setWeedsDetectedCount] = useState(0); // total weeds detected
  const [tankLevel, setTankLevel] = useState(100); // battery level
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [cameraAlerts, setCameraAlerts] = useState(Array(6).fill('healthy')); // 'healthy' | 'gog' | 'yog'
  const [detectionsLog, setDetectionsLog] = useState([]);

  // Map layer visibility toggles
  const [layers, setLayers] = useState({
    heatmap: true,
    gog: true,
    yog: true,
    path: true, // Grid layer
  });

  // Animated Scan Sweep values
  const scanLineAnim = useRef(new Animated.Value(-10)).current;
  const [isScanning, setIsScanning] = useState(false);

  // Sound/Vibe triggers
  const triggerNozzleTest = () => {
    Alert.alert(
      t('weedDetection.testNozzle', 'Ping Cameras'),
      'This will broadcast a status query packet to all camera poles to test battery health and communication latency.',
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: 'Ping Nodes', 
          onPress: () => {
            Alert.alert('Success', t('weedDetection.valvesResponsive', 'All camera poles responsive. Latency check completed.'));
          }
        }
      ]
    );
  };

  const syncSettings = () => {
    Alert.alert(
      t('weedDetection.syncEdgeBox', 'Sync Settings'),
      `Upload configuration parameters to Camera Node hubs?\n\nDetection Mode: ${selectedMode === 'gog' ? 'Green-on-Green' : 'Yellow-on-Green'}\nCapture Interval: ${speed}s\nInference Limit: ${delay}ms`,
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.ok', 'Upload'), 
          onPress: () => {
            Alert.alert('Synced', t('weedDetection.settingsSynced', 'Settings successfully synced with pole camera edge nodes over MQTT.'));
          }
        }
      ]
    );
  };

  // Reset all simulation history
  const handleResetSimulation = () => {
    setIsSpraying(false);
    setIsScanning(false);
    scanLineAnim.setValue(-10);
    setScannedArea(0);
    setChemicalSaved(98);
    setWeedsDetectedCount(0);
    setTankLevel(100);
    setActiveCameraIndex(0);
    setCameraAlerts(Array(6).fill('healthy'));
    setDetectionsLog([]);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'reset' }));
    }
  };

  const latency = delay; // direct reference
  const getDriftStatus = (lat) => {
    if (lat < 35) return { color: COLORS.success, text: t('weedDetection.optimalDrift', 'Optimal (< 45ms)') };
    if (lat < 80) return { color: COLORS.warning, text: t('weedDetection.suboptimalDrift', 'Sub-optimal (45-100ms)') };
    return { color: COLORS.danger, text: t('weedDetection.highRiskDrift', 'Lag Warning (> 100ms)') };
  };
  const driftStatus = getDriftStatus(latency);

  // Load fields on component load
  useEffect(() => {
    dispatch(fetchFields());
  }, [dispatch]);

  // Main simulation coordinator (switches active camera according to the Capture Interval)
  useEffect(() => {
    let timer = null;
    if (isSpraying && !isScanning) {
      const scanPeriodMs = (speed * 1000) / simulationMultiplier;
      timer = setTimeout(() => {
        triggerCameraScan();
      }, scanPeriodMs);
    }
    return () => clearTimeout(timer);
  }, [isSpraying, isScanning, activeCameraIndex, speed, simulationMultiplier]);

  // Trigger camera scan overlay animation and coordinate plotting
  const triggerCameraScan = () => {
    setIsScanning(true);
    scanLineAnim.setValue(-10);

    const activePole = cameraPoles.current[activeCameraIndex];

    // 1. Tell WebView map to fly to this camera coordinates
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setActiveCamera',
        id: activePole.id
      }));
    }

    // Wait 1.2s for map flyTo animation to settle before starting scan sweep overlay
    setTimeout(() => {
      if (!isSpraying) {
        setIsScanning(false);
        return;
      }

      // 2. Start scanner green line sweep animation
      Animated.timing(scanLineAnim, {
        toValue: 330,
        duration: 2200 / simulationMultiplier,
        useNativeDriver: false
      }).start(() => {
        // Scan complete logic
        setIsScanning(false);
        setScannedArea((prev) => prev + 1);
        setTankLevel((prev) => Math.max(0, parseFloat((prev - 0.4 * simulationMultiplier).toFixed(1))));

        // 3. Generate mock target weeds/disease spots on leaf for this scan
        const hasDetections = Math.random() < 0.65;
        const targets = [];
        if (hasDetections) {
          const isGog = selectedMode === 'gog';
          const gogLabels = ['Wild Oats', 'Barnyard Grass', 'Pigweed', 'Ryegrass'];
          const yogLabels = ['Leaf Chlorosis', 'Yellow Bloom', 'Nutrient Deficiency'];
          const count = Math.random() < 0.8 ? 1 : 2;

          for (let i = 0; i < count; i++) {
            targets.push({
              id: i + 1,
              label: isGog ? gogLabels[Math.floor(Math.random() * gogLabels.length)] : yogLabels[Math.floor(Math.random() * yogLabels.length)],
              confidence: Math.floor(75 + Math.random() * 20),
              type: selectedMode
            });
          }
        }

        // Record logs and map markings for each detected target
        if (targets.length > 0) {
          setWeedsDetectedCount((prev) => prev + targets.length);
          
          setCameraAlerts((prev) => {
            const next = [...prev];
            next[activeCameraIndex] = selectedMode;
            return next;
          });

          const newLogs = [];
          targets.forEach((target) => {
            // Plot target circles at random offsets around camera pole
            const latOffset = (Math.random() - 0.5) * 0.00012;
            const lngOffset = (Math.random() - 0.5) * 0.00012;
            const hitLat = activePole.lat + latOffset;
            const hitLng = activePole.lng + lngOffset;

            // Post hit to Leaflet WebView
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'addWeedHit',
                lat: hitLat,
                lng: hitLng,
                mode: selectedMode,
                cameraId: activePole.id
              }));
            }

            const timestamp = new Date().toLocaleTimeString().split(' ')[0];
            newLogs.push(`[${timestamp}] Pole #${activePole.id} Alert: ${target.label} (${target.confidence}%) detected by AI node`);
          });

          setDetectionsLog((prev) => [...newLogs, ...prev].slice(0, 30));
        } else {
          // Clear camera alert if clean
          setCameraAlerts((prev) => {
            const next = [...prev];
            next[activeCameraIndex] = 'healthy';
            return next;
          });
          const timestamp = new Date().toLocaleTimeString().split(' ')[0];
          setDetectionsLog((prev) => [`[${timestamp}] Pole #${activePole.id} Scan: No weeds or anomalies detected. Canopy healthy.`, ...prev].slice(0, 30));
        }

        // Tally Field Health Index
        setChemicalSaved((prev) => {
          const factor = targets.length > 0 ? -1.5 : 0.5;
          return Math.round(Math.min(99, Math.max(45, prev + factor)));
        });

        // Shift to the next Camera Pole in grid sequence
        setActiveCameraIndex((prev) => (prev + 1) % 6);
      });
    }, 1200); // 1.2s delay for WebView map focus panning
  };

  const handleToggleLayer = (layerName) => {
    const nextVal = !layers[layerName];
    setLayers((prev) => ({ ...prev, [layerName]: nextVal }));
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'toggleLayer',
        layer: layerName,
        visible: nextVal
      }));
    }
  };

  return (
    <ScreenLayout
      title={t('weedDetection.title', 'AI Field Monitor')}
      showBack
      onBack={() => {
        setIsSpraying(false);
        navigation.goBack();
      }}
      scrollable={true}
    >
      <View style={styles.masterContainer}>
        
        {/* UNIFIED INTERACTIVE SATELLITE SCANNER MAP CONTAINER */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: generateWeedMapHTML(fieldLat, fieldLng, cameraPoles.current) }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          {/* Radar Scanning Overlay: Renders on top of the Map WebView */}
          {isScanning && (
            <View style={styles.scannerOverlay}>
              {/* Pulsing radar grid concentric circles */}
              <View style={styles.radarScope} />
              <View style={styles.radarScopeOuter} />
              {/* Sweeping scan bar */}
              <Animated.View style={[styles.scanLine, { top: scanLineAnim }]} />
            </View>
          )}

          {/* Active Status Badge Overlay */}
          <View style={styles.statusIndicator}>
            <View style={styles.statusIndicatorBadge}>
              <View style={[styles.statusDot, { backgroundColor: isSpraying ? (isScanning ? '#00E676' : '#2196F3') : '#90A4AE' }]} />
              <Text style={styles.statusIndicatorText}>
                {isSpraying
                  ? (isScanning 
                      ? `SCANNING POLE #${activeCameraIndex + 1}` 
                      : `FOCUSING POLE #${activeCameraIndex + 1}...`)
                  : 'MONITOR STANDBY'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Map Layer Filter Chips - Compact scroll bar directly under Map */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layerRow}>
          <TouchableOpacity 
            style={[styles.layerChip, layers.heatmap && styles.activeLayerChip]}
            onPress={() => handleToggleLayer('heatmap')}
          >
            <MaterialCommunityIcons name="fire" size={16} color={layers.heatmap ? COLORS.white : '#78909C'} />
            <Text style={[styles.layerChipText, layers.heatmap && styles.activeLayerChipText]}>
              {t('weedDetection.layerHeatmap', 'Infestation Heatmap')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.layerChip, layers.gog && styles.activeLayerChip]}
            onPress={() => handleToggleLayer('gog')}
          >
            <MaterialCommunityIcons name="target" size={16} color={layers.gog ? COLORS.white : '#78909C'} />
            <Text style={[styles.layerChipText, layers.gog && styles.activeLayerChipText]}>
              {t('weedDetection.gogMode', 'GoG Targets')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.layerChip, layers.yog && styles.activeLayerChip]}
            onPress={() => handleToggleLayer('yog')}
          >
            <MaterialCommunityIcons name="alert-decagram-outline" size={16} color={layers.yog ? COLORS.white : '#78909C'} />
            <Text style={[styles.layerChipText, layers.yog && styles.activeLayerChipText]}>
              {t('weedDetection.layerSpots', 'Disease Spots')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.layerChip, layers.path && styles.activeLayerChip]}
            onPress={() => handleToggleLayer('path')}
          >
            <MaterialCommunityIcons name="vector-line" size={16} color={layers.path ? COLORS.white : '#78909C'} />
            <Text style={[styles.layerChipText, layers.path && styles.activeLayerChipText]}>
              {t('weedDetection.layerPath', 'Grid')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Core Controls Dashboard Panel (Merged) */}
        <View style={styles.darkCockpitCard}>
          <View style={styles.cockpitHeader}>
            <Text style={styles.cockpitTitle}>Camera Scan Controller</Text>
            
            {/* Mode Selectors */}
            <View style={styles.cockpitTabContainer}>
              <TouchableOpacity
                style={[styles.cockpitTab, selectedMode === 'gog' && styles.activeCockpitTab]}
                onPress={() => setSelectedMode('gog')}
              >
                <Text style={[styles.cockpitTabText, selectedMode === 'gog' && styles.activeCockpitTabText]}>GoG</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cockpitTab, selectedMode === 'yog' && styles.activeCockpitTab]}
                onPress={() => setSelectedMode('yog')}
              >
                <Text style={[styles.cockpitTabText, selectedMode === 'yog' && styles.activeCockpitTabText]}>YoG</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Crop Selector */}
          <View style={styles.cropSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropScroll}>
              {['Soybean', 'Cotton', 'Wheat', 'Maize'].map((crop) => (
                <TouchableOpacity
                  key={crop}
                  style={[styles.cropPill, selectedCrop === crop && styles.activeCropPill]}
                  onPress={() => setSelectedCrop(crop)}
                >
                  <MaterialCommunityIcons 
                    name={
                      crop === 'Soybean' ? 'sprout' :
                      crop === 'Cotton' ? 'flower-poppy' :
                      crop === 'Wheat' ? 'barley' : 'corn'
                    } 
                    size={14} 
                    color={selectedCrop === crop ? COLORS.white : '#A2BFA5'} 
                  />
                  <Text style={[styles.cropPillText, selectedCrop === crop && styles.activeCropPillText]}>
                    {crop}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Active Camera Node Status Row */}
          <View style={styles.nozzleSection}>
            <Text style={styles.nozzleSectionTitle}>{t('weedDetection.nozzleStatus', 'Camera Pole Status (6 Nodes)')}</Text>
            <View style={styles.nozzleBar}>
              {cameraPoles.current.map((pole, i) => {
                const alertState = cameraAlerts[i];
                const isActive = activeCameraIndex === i && isSpraying;
                
                let nodeColor = '#546E5A'; // idle grey
                let textColor = '#90A4AE';
                if (isActive) {
                  nodeColor = '#2196F3'; // active blue
                  textColor = '#2196F3';
                } else if (alertState === 'gog') {
                  nodeColor = '#EF5350'; // GoG Alert Red (weed)
                  textColor = '#EF5350';
                } else if (alertState === 'yog') {
                  nodeColor = '#FFCA28'; // YoG Alert Yellow (disease)
                  textColor = '#FFCA28';
                } else if (isSpraying) {
                  nodeColor = '#00E676'; // active green (healthy online)
                  textColor = '#00E676';
                }

                return (
                  <View key={pole.id} style={[styles.nozzleIndicator, isActive && styles.activeNozzleIndicator, { borderColor: nodeColor }]}>
                    <MaterialCommunityIcons name="cctv" size={14} color={nodeColor} />
                    <Text style={[styles.nozzleText, { color: textColor }]}>Node {pole.id}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Auto Scan Buttons */}
          <View style={styles.cockpitActionRow}>
            <TouchableOpacity
              style={[styles.cockpitActionBtn, isSpraying ? styles.btnStop : styles.btnStart]}
              onPress={() => setIsSpraying(!isSpraying)}
            >
              <MaterialCommunityIcons name={isSpraying ? 'stop-circle' : 'play-circle'} size={20} color={COLORS.white} />
              <Text style={styles.cockpitActionBtnText}>
                {isSpraying ? t('weedDetection.stopSpraying', 'Stop Scan') : t('weedDetection.startSpraying', 'Start Auto-Scan')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cockpitResetBtn} onPress={handleResetSimulation}>
              <MaterialCommunityIcons name="refresh" size={18} color="#90A4AE" />
              <Text style={styles.cockpitResetText}>Reset</Text>
            </TouchableOpacity>

            {/* Simulation speed multiplier */}
            <View style={styles.miniSpeedSelect}>
              {[1, 2, 5].map((multiplier) => (
                <TouchableOpacity
                  key={multiplier}
                  style={[styles.miniSpeedBtn, simulationMultiplier === multiplier && styles.activeMiniSpeedBtn]}
                  onPress={() => setSimulationMultiplier(multiplier)}
                >
                  <Text style={[styles.miniSpeedBtnText, simulationMultiplier === multiplier && styles.activeMiniSpeedBtnText]}>
                    {multiplier}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Live Analysis Terminal Log */}
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <MaterialCommunityIcons name="console-network" size={18} color="#FFB300" />
            <Text style={styles.logTitle}>{t('weedDetection.liveDetections', 'Live Analysis Feed')}</Text>
          </View>
          <ScrollView 
            style={styles.logContainer}
            contentContainerStyle={styles.logContent}
            nestedScrollEnabled={true}
          >
            {detectionsLog.length === 0 ? (
              <Text style={styles.emptyLogText}>
                {t('weedDetection.emptyDetections', 'No scans logged. Press "Start Auto-Scan" to run.')}
              </Text>
            ) : (
              detectionsLog.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>

        {/* Telemetry Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>{t('weedDetection.efficiencyStats', 'Field Health & Scan Stats')}</Text>
          
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetrySub}>{t('weedDetection.weedsHit', 'Weeds Detected')}</Text>
              <Text style={styles.telemetryValue}>{weedsDetectedCount}</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetrySub}>{t('weedDetection.chemicalSaved', 'Field Health Index')}</Text>
              <Text style={[styles.telemetryValue, { color: COLORS.success }]}>{chemicalSaved}%</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetrySub}>{t('weedDetection.scanArea', 'Scanned Images')}</Text>
              <Text style={styles.telemetryValue}>{scannedArea}</Text>
            </View>
          </View>

          <View style={styles.telemetrySubGrid}>
            <View style={styles.telemetrySubItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#4FC3F7" />
              <Text style={styles.telemetrySubLabel}>
                {t('weedDetection.flowRate', 'Interval')}: <Text style={styles.telemetrySubVal}>{speed} sec</Text>
              </Text>
            </View>
            
            <View style={styles.telemetrySubItem}>
              <MaterialCommunityIcons name="battery-high" size={16} color="#00E676" />
              <Text style={styles.telemetrySubLabel}>
                {t('weedDetection.tankLevel', 'Battery Level')}: <Text style={styles.telemetrySubVal}>{tankLevel.toFixed(0)}%</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Configuration Sliders */}
        <View style={styles.calibrationCard}>
          <Text style={styles.calibrationCardTitle}>{t('weedDetection.sprayerCalibration', 'AI Camera Configuration')}</Text>
          
          <View style={styles.sliderBox}>
            <View style={styles.sliderTextRow}>
              <Text style={styles.sliderLabel}>{t('weedDetection.vehicleSpeed', 'Capture Interval')}</Text>
              <Text style={styles.sliderVal}>{speed} sec</Text>
            </View>
            <Slider
              minimumValue={3}
              maximumValue={20}
              step={1}
              value={speed}
              onValueChange={setSpeed}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>

          <View style={styles.sliderBox}>
            <View style={styles.sliderTextRow}>
              <Text style={styles.sliderLabel}>{t('weedDetection.solenoidDelay', 'Camera Exposure')}</Text>
              <Text style={styles.sliderVal}>{delay} ms</Text>
            </View>
            <Slider
              minimumValue={5}
              maximumValue={50}
              step={1}
              value={delay}
              onValueChange={setDelay}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>

          <View style={styles.sliderBox}>
            <View style={styles.sliderTextRow}>
              <Text style={styles.sliderLabel}>{t('weedDetection.confidenceGate', 'AI Confidence Gate')}</Text>
              <Text style={styles.sliderVal}>{threshold}%</Text>
            </View>
            <Slider
              minimumValue={50}
              maximumValue={95}
              step={5}
              value={threshold}
              onValueChange={setThreshold}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>

          {/* Inference Latency Display Panel */}
          <View style={styles.displacementCard}>
            <View style={styles.displacementHeader}>
              <MaterialCommunityIcons name="calculator" size={16} color={COLORS.textSecondary} />
              <Text style={styles.displacementTitle}>{t('weedDetection.targetDrift', 'Inference Processing Latency')}</Text>
            </View>
            <View style={styles.displacementBody}>
              <View>
                <Text style={styles.displacementNumber}>{latency} ms</Text>
                <Text style={styles.displacementSub}>{t('weedDetection.estimatedNozzleDisplacement', 'Estimated time taken to run edge inference')}</Text>
              </View>
              <View style={[styles.driftPill, { backgroundColor: driftStatus.color + '15' }]}>
                <Text style={[styles.driftPillText, { color: driftStatus.color }]}>
                  {driftStatus.text}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Edge Node Sync Actions */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.nozzleTestBtn} onPress={triggerNozzleTest}>
            <MaterialCommunityIcons name="cctv" size={16} color={COLORS.danger} />
            <Text style={styles.nozzleTestBtnText}>{t('weedDetection.testNozzle', 'Ping Cameras')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.edgeUploadBtn} onPress={syncSettings}>
            <MaterialCommunityIcons name="cloud-upload" size={16} color={COLORS.white} />
            <Text style={styles.edgeUploadBtnText}>{t('weedDetection.syncEdgeBox', 'Sync Settings')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding to prevent floating tab bar overlap */}
        <View style={{ height: 130 }} />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  masterContainer: {
    width: '100%',
  },
  
  // Interactive WebView Map and Scanner overlay
  mapContainer: {
    height: 330,
    backgroundColor: '#0B120C',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1B3020',
    position: 'relative',
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  webView: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 230, 118, 0.04)',
    pointerEvents: 'none', // Touch elements can slide down to webview underneath
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 3,
  },
  radarScope: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 200,
    height: 200,
    marginLeft: -100,
    marginTop: -100,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 230, 118, 0.15)',
    borderRadius: 100,
  },
  radarScopeOuter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 280,
    height: 280,
    marginLeft: -140,
    marginTop: -140,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 140,
  },
  statusIndicator: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(12, 20, 14, 0.85)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#1D3321',
  },
  statusIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusIndicatorText: {
    color: '#E8F5E9',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Map Filter Chips Row
  layerRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  layerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 4,
  },
  activeLayerChip: {
    backgroundColor: COLORS.primary,
  },
  layerChipText: {
    fontSize: 11,
    color: '#546E7A',
    fontWeight: FONT_WEIGHTS.medium,
  },
  activeLayerChipText: {
    color: COLORS.white,
  },

  // Cockpit view styling
  darkCockpitCard: {
    backgroundColor: '#0C140E',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1B3020',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  cockpitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cockpitTitle: {
    color: '#E8F5E9',
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  cockpitTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#142217',
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1D3321',
    width: 100,
  },
  cockpitTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  activeCockpitTab: {
    backgroundColor: COLORS.primary,
  },
  cockpitTabText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#90A4AE',
  },
  activeCockpitTabText: {
    color: COLORS.white,
  },
  cropSelector: {
    marginBottom: SPACING.md,
  },
  cropScroll: {
    gap: SPACING.sm,
  },
  cropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121C13',
    borderWidth: 1,
    borderColor: '#1F3321',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    gap: 4,
  },
  activeCropPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cropPillText: {
    fontSize: FONT_SIZES.xs,
    color: '#A2BFA5',
  },
  activeCropPillText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Camera Pole Grid Status Indicators
  nozzleSection: {
    backgroundColor: '#121C13',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1D3321',
    marginBottom: SPACING.md,
  },
  nozzleSectionTitle: {
    color: '#90A4AE',
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semiBold,
    marginBottom: 8,
  },
  nozzleBar: {
    flexDirection: 'row',
    gap: 5,
  },
  nozzleIndicator: {
    flex: 1,
    backgroundColor: '#0C140E',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  nozzleText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: 3,
  },

  // Action Buttons
  cockpitActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cockpitActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
    flex: 1.8,
    ...SHADOWS.sm,
  },
  btnStart: {
    backgroundColor: COLORS.primary,
  },
  btnStop: {
    backgroundColor: '#EF5350',
  },
  cockpitActionBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  cockpitResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D3321',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    flex: 1,
    gap: 4,
    backgroundColor: '#121C13',
  },
  cockpitResetText: {
    color: '#90A4AE',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  miniSpeedSelect: {
    flexDirection: 'row',
    backgroundColor: '#142217',
    borderRadius: BORDER_RADIUS.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1D3321',
  },
  miniSpeedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 3,
  },
  activeMiniSpeedBtn: {
    backgroundColor: COLORS.primary,
  },
  miniSpeedBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#90A4AE',
  },
  activeMiniSpeedBtnText: {
    color: COLORS.white,
  },

  // Terminal scroll log styling
  logCard: {
    backgroundColor: '#0C140E',
    borderWidth: 1,
    borderColor: '#1F3321',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    height: 110,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1D3321',
    paddingBottom: 4,
    marginBottom: 4,
  },
  logTitle: {
    color: '#A2BFA5',
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  logContainer: {
    flex: 1,
  },
  logContent: {
    paddingVertical: 2,
  },
  emptyLogText: {
    color: '#546E5A',
    fontSize: 9,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  logText: {
    color: '#00E676',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    lineHeight: 11,
    marginBottom: 2,
  },

  // Telemetry indicators card
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  statsCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetrySub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  telemetryValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  telemetryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.divider,
  },
  telemetrySubGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xl,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  telemetrySubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetrySubLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  telemetrySubVal: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  // Calibration cards
  calibrationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  calibrationCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },
  sliderBox: {
    marginBottom: SPACING.xl,
  },
  sliderTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sliderVal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  displacementCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  displacementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  displacementTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  displacementBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  displacementNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  displacementSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  driftPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  driftPillText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  // Footer actions
  nozzleTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
  },
  nozzleTestBtnText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  edgeUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    flex: 1.5,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    ...SHADOWS.sm,
  },
  edgeUploadBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default WeedDetectionHomeScreen;
