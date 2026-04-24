import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import {
  Header,
  ListItem,
  SectionHeader,
  Avatar,
} from '../../components';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('vi');

  const iconBox = (name: keyof typeof Ionicons.glyphMap, bg: string) => (
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      <Ionicons name={name} size={16} color="#fff" />
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header title="Cài đặt" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, Shadow.md]}>
          <Avatar name="Admin" size={64} color={Colors.primary} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Admin</Text>
            <Text style={styles.profileRole}>Chủ cửa hàng</Text>
            <View style={styles.storeRow}>
              <Ionicons name="storefront-outline" size={12} color={Colors.primary} />
              <Text style={styles.storeName}>VMASS Store</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tài khoản */}
        <SectionHeader title="Tài khoản" />
        <View style={styles.group}>
          <ListItem
            title="Thông tin cá nhân"
            left={iconBox('person-outline', Colors.primary)}
            onPress={() => {}}
          />
          <ListItem
            title="Đổi mật khẩu"
            left={iconBox('lock-closed-outline', '#7c3aed')}
            onPress={() => {}}
          />
          <ListItem
            title="Phân quyền"
            left={iconBox('shield-checkmark-outline', '#0891b2')}
            onPress={() => {}}
          />
          <ListItem
            title="Đăng xuất"
            left={iconBox('log-out-outline', Colors.danger)}
            right={<Text style={styles.dangerText}>Đăng xuất</Text>}
            showChevron={false}
            onPress={() => {}}
          />
        </View>

        {/* Bán hàng & In */}
        <SectionHeader title="Bán hàng & In" />
        <View style={styles.group}>
          <ListItem
            title="Cấu hình POS"
            left={iconBox('cash-outline', Colors.success)}
            onPress={() => {}}
          />
          <ListItem
            title="Mẫu hóa đơn"
            left={iconBox('document-text-outline', Colors.warning)}
            onPress={() => {}}
          />
          <ListItem
            title="Kết nối máy in"
            left={iconBox('print-outline', Colors.primary)}
            onPress={() => {}}
          />
          <ListItem
            title="Máy quét barcode"
            left={iconBox('barcode-outline', '#db2777')}
            onPress={() => {}}
          />
        </View>

        {/* Kết nối */}
        <SectionHeader title="Kết nối" />
        <View style={styles.group}>
          <ListItem
            title="Shopee"
            subtitle="Chưa kết nối"
            left={iconBox('cart-outline', '#f57c00')}
            onPress={() => {}}
          />
          <ListItem
            title="Lazada"
            subtitle="Chưa kết nối"
            left={iconBox('bag-outline', '#7c3aed')}
            onPress={() => {}}
          />
          <ListItem
            title="TikTok Shop"
            subtitle="Chưa kết nối"
            left={iconBox('musical-notes-outline', '#1a1a1a')}
            onPress={() => {}}
          />
          <ListItem
            title="Tiki"
            subtitle="Chưa kết nối"
            left={iconBox('storefront-outline', '#008ecc')}
            onPress={() => {}}
          />
          <ListItem
            title="VNPT eTax"
            subtitle="Chưa kết nối"
            left={iconBox('receipt-outline', '#2e7d32')}
            onPress={() => {}}
          />
          <ListItem
            title="Kết nối Zalo OA"
            subtitle="Chưa kết nối"
            left={iconBox('chatbubble-ellipses-outline', '#008ecc')}
            onPress={() => {}}
          />
        </View>

        {/* Giao diện */}
        <SectionHeader title="Giao diện" />
        <View style={styles.group}>
          {/* Dark mode toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              {iconBox('moon-outline', '#1a1a1a')}
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleLabel}>Dark mode</Text>
                <Text style={styles.toggleSub}>Chuyển sang giao diện tối</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {/* Language selector */}
          <View style={styles.langRow}>
            <View style={styles.toggleLeft}>
              {iconBox('language-outline', Colors.primary)}
              <Text style={styles.toggleLabel}>Ngôn ngữ</Text>
            </View>
            <View style={styles.langChips}>
              {[{ key: 'vi', label: 'VN' }, { key: 'en', label: 'EN' }].map(l => (
                <TouchableOpacity
                  key={l.key}
                  onPress={() => setLanguage(l.key)}
                  style={[styles.langChip, language === l.key && styles.langChipActive]}>
                  <Text style={[styles.langChipText, language === l.key && styles.langChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <ListItem
            title="Mật độ thông tin"
            subtitle="Thường"
            left={iconBox('options-outline', Colors.primary)}
            onPress={() => {}}
          />
        </View>

        {/* Khác */}
        <SectionHeader title="Khác" />
        <View style={styles.group}>
          <ListItem
            title="Sao lưu dữ liệu"
            left={iconBox('cloud-upload-outline', Colors.primary)}
            onPress={() => {}}
          />
          <ListItem
            title="Khôi phục"
            left={iconBox('refresh-outline', Colors.warning)}
            onPress={() => {}}
          />
          <ListItem
            title="Hướng dẫn sử dụng"
            left={iconBox('help-circle-outline', Colors.success)}
            onPress={() => {}}
          />
          <ListItem
            title="Liên hệ hỗ trợ"
            left={iconBox('headset-outline', '#7c3aed')}
            onPress={() => {}}
          />
          <ListItem
            title="Phiên bản 1.0.0"
            left={iconBox('information-circle-outline', Colors.textSecondary)}
            right={<Text style={styles.versionText}>v1.0.0</Text>}
            showChevron={false}
            onPress={() => {}}
          />
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.h4,
    color: Colors.text,
  },
  profileRole: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  storeName: {
    ...Typography.captionMd,
    color: Colors.primary,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    ...Typography.bodyMd,
    color: Colors.danger,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTextWrap: {},
  toggleLabel: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  toggleSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  langChips: {
    flexDirection: 'row',
    gap: 6,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  langChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langChipText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  langChipTextActive: {
    color: '#fff',
  },
  versionText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  footer: {
    height: 32,
  },
});
