import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '../theme';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
  color?: string;
}

function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]?.toUpperCase()).join('');
}

const COLORS = [Colors.primary, '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export function Avatar({ name, uri, size = 40, color }: AvatarProps) {
  const bg = color || colorFor(name);
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
});
