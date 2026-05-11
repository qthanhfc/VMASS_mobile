import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getRoleCatalog, getUserRoleDetailById } from '../../services';
import { ManageStackParamList } from '../../navigation';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import type { RoleCatalogItem, RolePermissionSetting } from '../../utils/roleRules';
import { PERMISSION_LABELS, PERMISSION_ORDER, splitPermissions } from '../../utils/roleRules';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'StaffRoleDetail'>;

type RoleDetailBlock = {
  alias: string;
  name: string;
  group: string;
  grantedPermissions: string[];
};

export function StaffRoleDetailScreen() {
  const { colors } = useThemeMode();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { roleId, roleName } = route.params;
  const [loading, setLoading] = useState(true);
  const [roleTitle, setRoleTitle] = useState(roleName);
  const [roleSettings, setRoleSettings] = useState<RolePermissionSetting[]>([]);
  const [catalog, setCatalog] = useState<RoleCatalogItem[]>([]);
  const [error, setError] = useState('');

  const openRoleSettings = () => {
    const tabsNav = nav.getParent() as any;
    if (!tabsNav) {
      return;
    }

    tabsNav.navigate('Settings', {
        screen: 'RoleSettings',
        params: {
          focusRoleId: String(roleId),
          focusRoleName: roleTitle,
          returnToManage: true,
        },
      });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [roleDetail, roleCatalog] = await Promise.all([
          getUserRoleDetailById(roleId),
          getRoleCatalog(),
        ]);

        if (!mounted) return;
        if (!roleDetail) {
          setError('Không tìm thấy thông tin nhóm quyền.');
          return;
        }

        setRoleTitle(roleDetail.name || roleName);
        setRoleSettings(roleDetail.settings || []);
        setCatalog(roleCatalog || []);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Không thể tải chi tiết quyền.';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [roleId, roleName]);

  const blocks = useMemo(() => {
    return catalog
      .map((item) => {
        const availablePermissions = splitPermissions(item.permissions || '');
        const grantedPermissions = availablePermissions
          .filter((permission) =>
            roleSettings.some(
              (setting) =>
                setting.role_alias === item.alias && setting.permission === permission,
            ),
          )
          .sort((a, b) => PERMISSION_ORDER.indexOf(a) - PERMISSION_ORDER.indexOf(b));

        return {
          alias: item.alias,
          name: item.name,
          group: item.group || 'Chung',
          grantedPermissions,
        } as RoleDetailBlock;
      })
      .filter((item) => item.grantedPermissions.length > 0);
  }, [catalog, roleSettings]);

  const groupedBlocks = useMemo(() => {
    const map = new Map<string, RoleDetailBlock[]>();
    blocks.forEach((block) => {
      const key = block.group;
      const current = map.get(key) || [];
      current.push(block);
      map.set(key, current);
    });
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, [blocks]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết quyền</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {roleTitle}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>Đang tải quyền...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.centerText, { color: Colors.danger }]}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            activeOpacity={0.84}
            style={styles.editActionBtn}
            onPress={openRoleSettings}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editActionText}>Mở trang chỉnh quyền</Text>
          </TouchableOpacity>

          {groupedBlocks.length === 0 ? (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nhóm quyền này chưa được cấu hình quyền chi tiết.</Text>
            </View>
          ) : (
            groupedBlocks.map((group) => (
              <View
                key={group.group}
                style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.groupTitle, { color: colors.text }]}>{group.group}</Text>
                {group.items.map((item) => (
                  <View key={item.alias} style={styles.roleBlock}>
                    <Text style={[styles.roleName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.badgeWrap}>
                      {item.grantedPermissions.map((permission) => (
                        <View key={`${item.alias}-${permission}`} style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {PERMISSION_LABELS[permission] || permission}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 70,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...Typography.captionMd,
    marginTop: 2,
    fontWeight: '600',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerText: {
    ...Typography.bodySm,
    marginTop: 10,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: 12,
    paddingBottom: 32,
  },
  editActionBtn: {
    minHeight: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  editActionText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
    ...Shadow.sm,
  },
  groupTitle: {
    ...Typography.label,
    fontWeight: '800',
    marginBottom: 10,
  },
  roleBlock: {
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(127,127,127,0.16)',
  },
  roleName: {
    ...Typography.bodySm,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '800',
  },
  emptyText: {
    ...Typography.bodySm,
    fontWeight: '600',
  },
});
