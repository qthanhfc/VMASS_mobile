import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Header } from '../../components';
import type { SettingsStackParamList } from '../../navigation';
import {
  createUserRole,
  getRoleCatalog,
  getUserRoles,
  updateUserRole,
  type UserRole,
} from '../../services';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import {
  PERMISSION_LABELS,
  PERMISSION_ORDER,
  countEnabledPermissions,
  getRoleTypeFromFlags,
  getVisibleRoleGroups,
  hasPermission,
  isPermissionDisabled,
  splitPermissions,
  togglePermission,
  type RoleCatalogItem,
  type RolePermissionSetting,
} from '../../utils/roleRules';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;
type Route = RouteProp<SettingsStackParamList, 'RoleSettings'>;

const PAGE_SIZE = 100;
const SCREEN_WIDTH = Dimensions.get('window').width;

const HIDDEN_MOBILE_ROLE_NAMES = [
  'Bàn ghế ngoài trang chủ',
  'Thống kê bàn chưa thu tiền',
  'Thống kê sản phẩm chưa nhận',
  'Thống kế sản phẩm chưa giao',
  'Thống kê sản phẩm chưa giao',
  'Thống kê sản phẩm chưa thu tiền',
  'Thống kế sản phẩm chưa thu tiền',
  'Recent Orders',
  'Lịch',
  'Danh sách các sản phẩm đã bán',
  'Quản lý bàn ghế',
  'Quản lý Qrcode',
  'Quản lý QRCode',
  'Hóa đơn',
  'Tin nhắn',
  'FQA',
  'FAQ',
  'Thông tin cá nhân',
  'Giới thiệu người mới',
  'Chốt ca',
  'Thống kê bàn'
].map(normalizeRoleName);

function normalizeRoleName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

function isHiddenOnMobile(role: RoleCatalogItem) {
  return HIDDEN_MOBILE_ROLE_NAMES.includes(normalizeRoleName(role.name));
}

export function RoleSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useThemeMode();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [catalog, setCatalog] = useState<RoleCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formName, setFormName] = useState('');
  const [formSettings, setFormSettings] = useState<RolePermissionSetting[]>([]);
  const [formRoleType, setFormRoleType] = useState<string | null>(null);
  const hasAutoOpenedRoleRef = useRef(false);
  const formProgress = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(
    async (refreshing = false) => {
      try {
        if (refreshing) setIsRefreshing(true);
        else setIsLoading(true);

        const [roleResult, catalogResult] = await Promise.all([
          getUserRoles({ pageSize: PAGE_SIZE, currentPage: 1 }),
          getRoleCatalog(),
        ]);

        setRoles(roleResult.data);
        setCatalog(catalogResult);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải danh sách phân quyền.';
        Alert.alert('Phân quyền', message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openCreateForm = () => {
    setEditingRole(null);
    setFormName('');
    setFormSettings([]);
    setFormRoleType(null);
    setFormVisible(true);
    formProgress.setValue(0);
    Animated.timing(formProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const openEditForm = (role: UserRole) => {
    setEditingRole(role);
    setFormName(role.name || '');
    setFormSettings(role.settings || []);
    setFormRoleType(getRoleTypeFromFlags(role));
    setFormVisible(true);
    formProgress.setValue(0);
    Animated.timing(formProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const focusRoleId = route.params?.focusRoleId;
    if (!focusRoleId || hasAutoOpenedRoleRef.current) return;
    if (roles.length === 0) return;

    const matchedRole = roles.find((role) => String(role.id) === String(focusRoleId));
    if (!matchedRole) return;

    hasAutoOpenedRoleRef.current = true;
    openEditForm(matchedRole);
    navigation.setParams({ focusRoleId: undefined, focusRoleName: undefined });
  }, [navigation, roles, route.params?.focusRoleId]);

  const closeForm = useCallback(() => {
    Animated.timing(formProgress, {
      toValue: 0,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;

      setFormVisible(false);
      setEditingRole(null);
      setFormName('');
      setFormSettings([]);
      setFormRoleType(null);
    });
  }, [formProgress]);

  const edgeSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          formVisible &&
          gestureState.x0 <= 28 &&
          gestureState.dx > 14 &&
          Math.abs(gestureState.dy) < 24,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 70 || gestureState.vx > 0.45) {
            closeForm();
          }
        },
        onPanResponderTerminate: (_, gestureState) => {
          if (gestureState.dx > 70 || gestureState.vx > 0.45) {
            closeForm();
          }
        },
      }),
    [closeForm, formVisible]
  );

  const handleBack = () => {
    if (formVisible) {
      closeForm();
      return;
    }

    if (route.params?.returnToManage) {
      const tabsNav = navigation.getParent() as any;
      tabsNav?.navigate('Manage');
      return;
    }

    navigation.goBack();
  };

  useEffect(() => {
    if (!formVisible) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeForm();
      return true;
    });

    return () => subscription.remove();
  }, [closeForm, formVisible]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !formVisible });

    return () => {
      navigation.setOptions({ gestureEnabled: true });
    };
  }, [formVisible, navigation]);

  const handleSave = async () => {
    const trimmedName = formName.trim();

    if (!trimmedName) {
      Alert.alert('Phân quyền', 'Tên phân quyền cần được thêm vào.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: trimmedName,
        role_aliases: formSettings,
      };

      if (editingRole) {
        await updateUserRole(editingRole.id, payload);
      } else {
        await createUserRole(payload);
      }

      await loadData();
      closeForm();
      Alert.alert('Phân quyền', 'Đã lưu phân quyền.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu phân quyền.';
      Alert.alert('Phân quyền', message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRolePermission = (role: RoleCatalogItem, permission: string) => {
    const supportedPermissions = splitPermissions(role.permissions);

    if (isPermissionDisabled(formSettings, role.alias, permission)) return;

    setFormSettings((current) =>
      togglePermission(current, role.alias, permission, supportedPermissions)
    );
  };

  const toggleRoleGroup = (groupRoles: RoleCatalogItem[], enabled: boolean) => {
    setFormSettings((current) => {
      const aliases = new Set(groupRoles.map((role) => role.alias));

      if (!enabled) {
        return current.filter((setting) => !aliases.has(setting.role_alias));
      }

      const nextSettings = [...current];

      groupRoles.forEach((role) => {
        splitPermissions(role.permissions).forEach((permission) => {
          const exists = nextSettings.some(
            (setting) => setting.role_alias === role.alias && setting.permission === permission
          );

          if (!exists) {
            nextSettings.push({ role_alias: role.alias, permission });
          }
        });
      });

      return nextSettings;
    });
  };

  const subtitle = formVisible
    ? editingRole
      ? 'Cập nhật quyền thao tác trong ứng dụng'
      : 'Tạo nhóm quyền mới cho nhân viên'
    : `${roles.length} nhóm quyền`;
  const formAnimatedStyle = {
    opacity: formProgress,
    transform: [
      {
        translateX: formProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_WIDTH, 0],
        }),
      },
    ],
  };
  const listAnimatedStyle = {
    opacity: formProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.35],
    }),
    transform: [
      {
        translateX: formProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -56],
        }),
      },
    ],
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background }]}
      {...edgeSwipeResponder.panHandlers}
    >
      <Header
        title={formVisible ? (editingRole ? 'Sửa phân quyền' : 'Thêm phân quyền') : 'Phân quyền'}
        subtitle={subtitle}
        onBack={handleBack}
        rightActions={
          formVisible ? (
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.headerButton, isSaving && styles.headerButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.headerButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.sceneWrap}>
        <Animated.View
          pointerEvents={formVisible ? 'none' : 'auto'}
          style={[styles.scenePanel, listAnimatedStyle]}
        >
          {isLoading && !isRefreshing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải phân quyền...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => loadData(true)}
                  tintColor={colors.primary}
                />
              }
            >
              {roles.length === 0 ? (
                <EmptyState
                  icon="shield-checkmark-outline"
                  title="Chưa có phân quyền"
                  description="Tạo nhóm quyền để kiểm soát thao tác của từng nhân viên."
                />
              ) : (
                <View style={[styles.roleListCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {roles.map((role, index) => (
                    <RoleCard
                      key={String(role.id)}
                      role={role}
                      onPress={() => openEditForm(role)}
                      isLast={index === roles.length - 1}
                    />
                  ))}
                </View>
              )}
              <View style={styles.footer} />
            </ScrollView>
          )}
          <TouchableOpacity activeOpacity={0.86} style={styles.fabPill} onPress={openCreateForm}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.fabPillText}>Tạo mới</Text>
          </TouchableOpacity>
        </Animated.View>

        {formVisible ? (
          <Animated.View style={[styles.scenePanel, styles.formAnimatedWrap, formAnimatedStyle]}>
            <RoleForm
              name={formName}
              settings={formSettings}
              catalog={catalog}
              roleType={formRoleType}
              onNameChange={setFormName}
              onTogglePermission={toggleRolePermission}
              onToggleGroup={toggleRoleGroup}
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function RoleForm({
  name,
  settings,
  catalog,
  roleType,
  onNameChange,
  onTogglePermission,
  onToggleGroup,
}: {
  name: string;
  settings: RolePermissionSetting[];
  catalog: RoleCatalogItem[];
  roleType: string | null;
  onNameChange: (value: string) => void;
  onTogglePermission: (role: RoleCatalogItem, permission: string) => void;
  onToggleGroup: (roles: RoleCatalogItem[], enabled: boolean) => void;
}) {
  const { colors } = useThemeMode();
  const groups = useMemo(
    () =>
      getVisibleRoleGroups(catalog, roleType)
        .map((group) => ({
          ...group,
          roles: group.roles.filter((role) => !isHiddenOnMobile(role)),
        }))
        .filter((group) => group.roles.length > 0),
    [catalog, roleType]
  );

  return (
    <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.nameCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Tên phân quyền</Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="Ví dụ: Thu ngân ca sáng"
          placeholderTextColor={colors.textSecondary}
          style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        />
      </View>

      {groups.length === 0 ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Chưa có danh mục quyền"
          description="Không lấy được danh sách quyền từ máy chủ."
        />
      ) : (
        groups.map((group) => (
          <View key={group.groupName} style={styles.permissionSection}>
            <PermissionGroupHeader
              title={group.groupName}
              enabled={isGroupFullySelected(group.roles, settings)}
              onValueChange={(enabled) => onToggleGroup(group.roles, enabled)}
            />
            <View style={[styles.permissionGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {group.roles.map((role, index) => (
                <PermissionRoleRow
                  key={role.alias}
                  role={role}
                  settings={settings}
                  onTogglePermission={onTogglePermission}
                  isLast={index === group.roles.length - 1}
                />
              ))}
            </View>
          </View>
        ))
      )}
      <View style={styles.footer} />
    </ScrollView>
  );
}

function RoleCard({
  role,
  onPress,
  isLast,
}: {
  role: UserRole;
  onPress: () => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeMode();
  const roleType = getRoleTypeFromFlags(role);
  const isDefault = Boolean(roleType);
  const permissionCount = countEnabledPermissions(role.settings || []);

  return (
    <TouchableOpacity
      activeOpacity={isDefault ? 1 : 0.78}
      style={[
        styles.roleRow,
        {
          backgroundColor: isDefault ? colors.card : colors.primaryLight,
        },
      ]}
      disabled={isDefault}
      onPress={onPress}
    >
      <View style={styles.roleMain}>
        <View style={[styles.roleIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.roleCopy}>
          <View style={styles.roleTitleRow}>
            <Text style={[styles.roleName, { color: colors.text }]} numberOfLines={1}>
              {role.name || 'Chưa đặt tên'}
            </Text>
            {roleType ? <Text style={styles.defaultTag}>Mặc định</Text> : null}
          </View>
          <Text style={[styles.roleMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {permissionCount} quyền đang bật
          </Text>
        </View>
      </View>
      {!isDefault ? (
        <View style={[styles.roleChevron, { backgroundColor: colors.background }]}>
          <Ionicons name="chevron-forward" size={17} color={colors.textSecondary} />
        </View>
      ) : null}
      {!isLast ? <DashedSeparator color={colors.border} /> : null}
    </TouchableOpacity>
  );
}

function DashedSeparator({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={styles.dashedSeparator}>
      {Array.from({ length: 36 }).map((_, index) => (
        <View key={index} style={[styles.dashSegment, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function isGroupFullySelected(roles: RoleCatalogItem[], settings: RolePermissionSetting[]) {
  const allPermissions = roles.flatMap((role) =>
    splitPermissions(role.permissions).map((permission) => ({
      alias: role.alias,
      permission,
    }))
  );

  if (!allPermissions.length) return false;

  return allPermissions.every(({ alias, permission }) => hasPermission(settings, alias, permission));
}

function PermissionRoleRow({
  role,
  settings,
  onTogglePermission,
  isLast,
}: {
  role: RoleCatalogItem;
  settings: RolePermissionSetting[];
  onTogglePermission: (role: RoleCatalogItem, permission: string) => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeMode();
  const supportedPermissions = splitPermissions(role.permissions);
  const orderedPermissions = PERMISSION_ORDER.filter(
    (permission) => supportedPermissions.includes(permission) && permission !== 'F'
  );
  const hasFullPermission = supportedPermissions.includes('F');

  const renderPermissionChip = (permission: string, isFull = false) => {
    const active = hasPermission(settings, role.alias, permission);
    const disabled = isPermissionDisabled(settings, role.alias, permission);

    return (
      <TouchableOpacity
        key={permission}
        activeOpacity={0.75}
        disabled={disabled}
        onPress={() => onTogglePermission(role, permission)}
        style={[
          styles.permissionChip,
          isFull && styles.fullPermissionChip,
          {
            backgroundColor: active ? colors.primary : colors.background,
            borderColor: active ? colors.primary : colors.border,
            opacity: disabled ? 0.42 : 1,
          },
        ]}
      >
        <Text style={[styles.permissionChipText, { color: active ? '#fff' : colors.text }]}>
          {PERMISSION_LABELS[permission] || permission}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.permissionRow}>
      <Text style={[styles.permissionName, { color: colors.text }]}>{role.name}</Text>
      <View style={styles.permissionControlsRow}>
        <View style={styles.permissionChips}>{orderedPermissions.map((permission) => renderPermissionChip(permission))}</View>
        {hasFullPermission ? (
          <View style={styles.fullPermissionWrap}>{renderPermissionChip('F', true)}</View>
        ) : null}
      </View>
      {!isLast ? <DashedSeparator color={colors.border} /> : null}
    </View>
  );
}

function PermissionGroupHeader({
  title,
  enabled,
  onValueChange,
}: {
  title: string;
  enabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionTitleLeft}>
        <Ionicons name="albums-outline" size={15} color={colors.textSecondary} />
        <Text style={[styles.sectionTitleText, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <View style={styles.selectAllWrap}>
        <Text style={[styles.selectAllText, { color: colors.textSecondary }]}>Tất cả</Text>
        <Switch
          value={enabled}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 28,
    gap: 10,
  },
  formContent: {
    padding: Spacing.md,
    paddingBottom: 28,
    gap: 10,
  },
  sceneWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  scenePanel: {
    ...StyleSheet.absoluteFillObject,
  },
  formAnimatedWrap: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    minWidth: 58,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  headerButtonDisabled: {
    opacity: 0.72,
  },
  headerButtonText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    ...Typography.captionMd,
    marginTop: 10,
    letterSpacing: 0,
  },
  roleListCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  roleRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    position: 'relative',
  },
  roleMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  roleCopy: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  roleName: {
    ...Typography.bodyMd,
    flex: 1,
    fontWeight: '700',
    letterSpacing: 0,
  },
  roleMeta: {
    ...Typography.caption,
    marginTop: 3,
    letterSpacing: 0,
  },
  roleChevron: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dashedSeparator: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: 0,
    height: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 4,
  },
  dashSegment: {
    width: 8,
    height: 1,
  },
  defaultTag: {
    ...Typography.label,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    letterSpacing: 0,
  },
  nameCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  fieldLabel: {
    ...Typography.captionMd,
    marginBottom: 8,
    letterSpacing: 0,
  },
  nameInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    ...Typography.bodyMd,
    letterSpacing: 0,
  },
  permissionSection: {
    gap: 0,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingTop: 2,
    paddingBottom: 6,
  },
  sectionTitleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: Spacing.sm,
  },
  sectionTitleText: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  selectAllWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  selectAllText: {
    ...Typography.captionMd,
    letterSpacing: 0,
  },
  permissionGroup: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  permissionRow: {
    padding: Spacing.md,
    gap: 10,
    position: 'relative',
  },
  permissionName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  permissionControlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  permissionChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  fullPermissionWrap: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  permissionChip: {
    minHeight: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  fullPermissionChip: {
    minWidth: 88,
  },
  permissionChipText: {
    ...Typography.captionMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  footer: {
    height: 18,
  },
  fabPill: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    ...Shadow.md,
  },
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
});
