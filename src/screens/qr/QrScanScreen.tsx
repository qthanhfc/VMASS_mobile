import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '../../theme';

const MODES = ['Barcode', 'QR Code', 'Ảnh'];
const RECENT_SCANS = [
  { id: 1, text: 'AT001 — Áo thun nam basic', time: '5 phút trước' },
  { id: 2, text: 'QJ002 — Quần jean slim fit', time: '20 phút trước' },
  { id: 3, text: 'CF004 — Cà phê hòa tan', time: '1 giờ trước' },
];

export function QrScanScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [mode, setMode] = useState('Barcode');
  const [flash, setFlash] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Dark header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét mã sản phẩm</Text>
        <TouchableOpacity onPress={() => setFlash(f => !f)} style={styles.iconBtn}>
          <Ionicons name={flash ? 'flash' : 'flash-outline'} size={22} color={flash ? '#FFD700' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Camera placeholder */}
      <View style={styles.cameraArea}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.cameraHint}>Camera preview</Text>
        </View>

        {/* Scan frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <View style={styles.scanLine} />
        </View>
      </View>

      {/* Mode selector */}
      <View style={styles.modeBar}>
        {MODES.map(m => (
          <TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.modeBtn, mode === m && styles.modeBtnActive]}>
            <Text style={[styles.modeLabel, mode === m && { color: '#fff' }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent scans */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>QUÉT GẦN ĐÂY</Text>
        {RECENT_SCANS.map(s => (
          <TouchableOpacity key={s.id} style={styles.recentRow}>
            <Ionicons name="barcode-outline" size={20} color={Colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recentText}>{s.text}</Text>
              <Text style={styles.recentTime}>{s.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_W = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, color: '#fff', flex: 1 },
  iconBtn: { padding: 4 },
  cameraArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  cameraHint: { ...Typography.caption, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  scanFrame: { width: 220, height: 220, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', width: '80%', height: 2, backgroundColor: Colors.primary, opacity: 0.8 },
  modeBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', margin: Spacing.lg, borderRadius: Radius.full, padding: 3 },
  modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.full },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeLabel: { ...Typography.captionMd, color: 'rgba(255,255,255,0.6)' },
  recentSection: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  recentTitle: { ...Typography.label, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.6, marginBottom: 10 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  recentText: { ...Typography.bodyMd, color: '#fff' },
  recentTime: { ...Typography.caption, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});
