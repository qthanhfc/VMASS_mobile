import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage, type TranslationKey } from '../i18n';
import { Colors, Typography, useThemeMode } from '../theme';
import { MessagesProvider, useMessages } from '../screens/messages/MessagesContext';
import type { Staff, StaffId } from '../types';

// ─── Param Lists ────────────────────────────────────────────────────────────

export type RootTabParamList = {
  Home: undefined;
  Manage: NavigatorScreenParams<ManageStackParamList> | undefined;
  Scan: undefined;
  Messages: undefined;
  Settings: undefined;
};
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Tabs: undefined;
  MessagesDetail: { threadId: number };
};

export type ManageStackParamList = {
  ManageMain: undefined;
  ProductsList: undefined;
  ProductCreate: undefined;
  ProductEdit: { id?: number };
  CustomersList: undefined;
  CustomerEdit: { id?: number; phone?: string };
  OrdersList: { customerPhone?: string; customerName?: string } | undefined;
  OrderDetail: { id: number | string };
  InventoryMain: undefined;
  InventoryEdit: { mode?: 'import' | 'export' | 'transfer' | 'audit'; scanItems?: ScanActionItem[] } | undefined;
  InventoryStockForm: { stockId?: number } | undefined;
  StaffList: undefined;
  StaffEdit: { id?: StaffId; preview?: Staff };
  StaffRoleDetail: { roleId: string; roleName: string };
  SuppliersList: undefined;
  SupplierEdit: { id?: number | string };
  ReturnsList: undefined;
  ReturnCreate: undefined;
  ReturnDetail: { id: string };
  PromotionsList: undefined;
  PromotionEdit: { id?: number };
  BookkeepingMain: undefined;
  BookkeepingEntry: undefined;
  DebtInvoiceMain: {
    search?: string;
    filter?: 'all' | 'receivable' | 'payable' | 'overdue' | 'open' | 'settled';
  } | undefined;
  DebtInvoiceDetail: { id: string };
  DebtInvoicePayment: { id: string };
  TaxMain: undefined;
  EcommerceMain: undefined;
  QrScan: undefined;
  PosScreen: { scanItems?: ScanActionItem[] } | undefined;
};

export type ScanActionItem = {
  code: string;
  name: string;
  sku?: string;
  qty: number;
  source: 'barcode' | 'qr' | 'image';
};

export type HomeStackParamList = { HomeMain: undefined };
export type MessagesStackParamList = { MessagesMain: undefined };
export type SettingsStackParamList = {
  SettingsMain: undefined;
  UpgradeAccount: undefined;
  ProfileSettings: undefined;
  PosSettings: undefined;
  PrintSettings: undefined;
  RoleSettings: { focusRoleId?: string; focusRoleName?: string; returnToManage?: boolean } | undefined;
  StaffAccountSettings: undefined;
  ChangePassword: undefined;
  DocsWebView: undefined;
  Feedback: undefined;
};

// ─── Screen Imports ─────────────────────────────────────────────────────────

import { HomeScreen } from '../screens/home/HomeScreen';
import { ManageScreen } from '../screens/manage/ManageScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { MessagesDetailScreen } from '../screens/messages/MessagesDetailScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { UpgradeAccountScreen } from '../screens/settings/UpgradeAccountScreen';
import { ProfileSettingsScreen } from '../screens/settings/ProfileSettingsScreen';
import { PosSettingsScreen } from '../screens/settings/PosSettingsScreen';
import { PrintSettingsScreen } from '../screens/settings/PrintSettingsScreen';
import { RoleSettingsScreen } from '../screens/settings/RoleSettingsScreen';
import { StaffAccountScreen } from '../screens/settings/StaffAccountScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { DocsWebViewScreen } from '../screens/settings/DocsWebViewScreen';
import { FeedbackScreen } from '../screens/settings/FeedbackScreen';
import { ProductsListScreen } from '../screens/products/ProductsListScreen';
import { ProductEditScreen } from '../screens/products/ProductEditScreen';
import { CustomersListScreen } from '../screens/customers/CustomersListScreen';
import { CustomerEditScreen } from '../screens/customers/CustomerEditScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { InventoryEditScreen } from '../screens/inventory/InventoryEditScreen';
import { InventoryStockFormScreen } from '../screens/inventory/InventoryStockFormScreen';
import { StaffListScreen } from '../screens/staff/StaffListScreen';
import { StaffEditScreen } from '../screens/staff/StaffEditScreen';
import { StaffRoleDetailScreen } from '../screens/staff/StaffRoleDetailScreen';
import { SuppliersListScreen } from '../screens/suppliers/SuppliersListScreen';
import { SupplierEditScreen } from '../screens/suppliers/SupplierEditScreen';
import { ReturnsListScreen } from '../screens/returns/ReturnsListScreen';
import { ReturnCreateScreen } from '../screens/returns/ReturnCreateScreen';
import { ReturnRequestDetailScreen } from '../screens/returns/ReturnRequestDetailScreen';
import { PromotionsListScreen } from '../screens/promotions/PromotionsListScreen';
import { PromotionEditScreen } from '../screens/promotions/PromotionEditScreen';
import { BookkeepingScreen } from '../screens/bookkeeping/BookkeepingScreen';
import { BookkeepingEntryScreen } from '../screens/bookkeeping/BookkeepingEntryScreen';
import { DebtInvoiceScreen } from '../screens/debt-invoice/DebtInvoiceScreen';
import { DebtInvoiceDetailScreen } from '../screens/debt-invoice/DebtInvoiceDetailScreen';
import { DebtInvoicePaymentScreen } from '../screens/debt-invoice/DebtInvoicePaymentScreen';
import { TaxScreen } from '../screens/tax/TaxScreen';
import { EcommerceScreen } from '../screens/ecommerce/EcommerceScreen';
import { QrScanScreen } from '../screens/qr/QrScanScreen';
import { PosScreen } from '../screens/pos/PosScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// ─── Stack Navigators ────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

const ManageStack = createNativeStackNavigator<ManageStackParamList>();
function ManageStackNavigator() {
  return (
    <ManageStack.Navigator screenOptions={{ headerShown: false }}>
      <ManageStack.Screen name="ManageMain" component={ManageScreen} />
      <ManageStack.Screen name="ProductsList" component={ProductsListScreen} />
      <ManageStack.Screen name="ProductCreate" component={ProductEditScreen} />
      <ManageStack.Screen name="ProductEdit" component={ProductEditScreen} />
      <ManageStack.Screen name="CustomersList" component={CustomersListScreen} />
      <ManageStack.Screen name="CustomerEdit" component={CustomerEditScreen} />
      <ManageStack.Screen name="OrdersList" component={OrdersListScreen} />
      <ManageStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <ManageStack.Screen name="InventoryMain" component={InventoryScreen} />
      <ManageStack.Screen name="InventoryEdit" component={InventoryEditScreen} />
      <ManageStack.Screen name="InventoryStockForm" component={InventoryStockFormScreen} />
      <ManageStack.Screen name="StaffList" component={StaffListScreen} />
      <ManageStack.Screen name="StaffEdit" component={StaffEditScreen} />
      <ManageStack.Screen name="StaffRoleDetail" component={StaffRoleDetailScreen} />
      <ManageStack.Screen name="SuppliersList" component={SuppliersListScreen} />
      <ManageStack.Screen name="SupplierEdit" component={SupplierEditScreen} />
      <ManageStack.Screen name="ReturnsList" component={ReturnsListScreen} />
      <ManageStack.Screen name="ReturnCreate" component={ReturnCreateScreen} />
      <ManageStack.Screen name="ReturnDetail" component={ReturnRequestDetailScreen} />
      <ManageStack.Screen name="PromotionsList" component={PromotionsListScreen} />
      <ManageStack.Screen name="PromotionEdit" component={PromotionEditScreen} />
      <ManageStack.Screen name="BookkeepingMain" component={BookkeepingScreen} />
      <ManageStack.Screen name="BookkeepingEntry" component={BookkeepingEntryScreen} />
      <ManageStack.Screen name="DebtInvoiceMain" component={DebtInvoiceScreen} />
      <ManageStack.Screen name="DebtInvoiceDetail" component={DebtInvoiceDetailScreen} />
      <ManageStack.Screen name="DebtInvoicePayment" component={DebtInvoicePaymentScreen} />
      <ManageStack.Screen name="TaxMain" component={TaxScreen} />
      <ManageStack.Screen name="EcommerceMain" component={EcommerceScreen} />
      <ManageStack.Screen name="QrScan" component={QrScanScreen} />
      <ManageStack.Screen name="PosScreen" component={PosScreen} />
    </ManageStack.Navigator>
  );
}

const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="MessagesMain" component={MessagesScreen} />
    </MessagesStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="UpgradeAccount" component={UpgradeAccountScreen} />
      <SettingsStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <SettingsStack.Screen name="PosSettings" component={PosSettingsScreen} />
      <SettingsStack.Screen name="PrintSettings" component={PrintSettingsScreen} />
      <SettingsStack.Screen name="RoleSettings" component={RoleSettingsScreen} />
      <SettingsStack.Screen name="StaffAccountSettings" component={StaffAccountScreen} />
      <SettingsStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <SettingsStack.Screen name="DocsWebView" component={DocsWebViewScreen} />
      <SettingsStack.Screen name="Feedback" component={FeedbackScreen} />
    </SettingsStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof RootTabParamList, { active: IoniconsName; inactive: IoniconsName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Manage: { active: 'grid', inactive: 'grid-outline' },
  Scan: { active: 'barcode', inactive: 'barcode-outline' },
  Messages: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABEL_KEYS: Record<keyof RootTabParamList, TranslationKey> = {
  Home: 'tabs.home',
  Manage: 'tabs.manage',
  Scan: 'tabs.scan',
  Messages: 'tabs.messages',
  Settings: 'tabs.settings',
};

function SketchVariantTwoTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { unreadSenderCount } = useMessages();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeMode();
  const { t } = useLanguage();
  const visibleRoutes = state.routes.filter((route) => route.name !== 'Scan');
  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);
  const activeTabName = state.routes[state.index]?.name;
  const manageRoute = state.routes.find((route) => route.name === 'Manage');
  const manageNestedState = manageRoute?.state as { key: string; index: number; routes: Array<{ name: string }> } | undefined;
  const manageActiveNestedRoute = manageNestedState?.routes?.[manageNestedState.index]?.name;
  const settingsRoute = state.routes.find((route) => route.name === 'Settings');
  const settingsNestedState = settingsRoute?.state as { key: string; index: number; routes: Array<{ name: string }> } | undefined;
  const settingsActiveNestedRoute = settingsNestedState?.routes?.[settingsNestedState.index]?.name;
  const shouldHideTabBar = Boolean(
    settingsNestedState && settingsNestedState.index > 0 && settingsActiveNestedRoute !== 'RoleSettings'
  );
  const shouldHideForManageRoute = Boolean(
    activeTabName === 'Manage' &&
    (manageActiveNestedRoute === 'PosScreen')
  );

  if (shouldHideTabBar || shouldHideForManageRoute) {
    return null;
  }

  const isScanActive = activeTabName === 'Scan' || (activeTabName === 'Manage' && manageActiveNestedRoute === 'QrScan');
  const tabBackground = isScanActive && !isDark ? '#111' : colors.card;
  const tabBorderColor = isScanActive && !isDark ? 'rgba(255,255,255,0.08)' : colors.border;
  const inactiveTabColor = isScanActive && !isDark ? 'rgba(255,255,255,0.62)' : colors.textSecondary;

  const renderTabItem = (route: (typeof state.routes)[number]) => {
    const routeName = route.name as keyof RootTabParamList;
    const isCurrentTab = state.routes[state.index].key === route.key;
    const isFocused = isCurrentTab && !(routeName === 'Manage' && isScanActive);
    const color = isFocused ? colors.primary : inactiveTabColor;
    const icons = TAB_ICONS[routeName];
    const labelStyle = [styles.tabLabel, { color }];
    const showBadge = routeName === 'Messages' && unreadSenderCount > 0;
    const badgeText = unreadSenderCount > 99 ? '99+' : String(unreadSenderCount);
    const spacingStyle =
      routeName === 'Manage'
        ? styles.tabItemNearCenterLeft
        : routeName === 'Messages'
          ? styles.tabItemNearCenterRight
          : undefined;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (event.defaultPrevented) {
        return;
      }

      if (route.name === 'Manage') {
        navigation.navigate('Manage');
        if (manageNestedState?.key) {
          navigation.dispatch({
            ...CommonActions.reset({
              index: 0,
              routes: [{ name: 'ManageMain' as never }],
            }),
            target: manageNestedState.key,
          });
        } else {
          navigation.navigate('Manage', { screen: 'ManageMain' });
        }
        return;
      }

      if (!isFocused) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
        testID={descriptors[route.key].options.tabBarButtonTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.tabItem, spacingStyle]}
      >
        <View style={styles.tabIconWrap}>
          <Ionicons name={icons.inactive} size={22} color={color} />
          {showBadge && (
            <View style={[styles.tabUnreadBadge, { borderColor: tabBackground }]}>
              <Text style={styles.tabUnreadBadgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        <Text style={labelStyle}>{t(TAB_LABEL_KEYS[routeName])}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: tabBackground,
          borderTopColor: tabBorderColor,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.tabBarRow}>
        <View style={styles.tabGroup}>{leftRoutes.map(renderTabItem)}</View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.scanQr')}
          onPress={() => navigation.navigate('Scan')}
          style={styles.scanTabItem}
        >
          <Ionicons
            name="barcode-outline"
            size={45}
            color={isScanActive ? colors.primary : inactiveTabColor}
          />
        </Pressable>
        <View style={styles.tabGroup}>{rightRoutes.map(renderTabItem)}</View>
      </View>
    </View>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <SketchVariantTwoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen
        name="Manage"
        component={ManageStackNavigator}
        options={{ popToTopOnBlur: true }}
      />
      <Tab.Screen name="Scan" component={QrScanScreen} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <MessagesProvider>
      <RootStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <RootStack.Screen name="Tabs" component={AppTabs} />
        <RootStack.Screen
          name="MessagesDetail"
          component={MessagesDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </RootStack.Navigator>
    </MessagesProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tabBarContainerDark: {
    backgroundColor: '#111',
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 48,
  },
  tabIconWrap: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabUnreadBadge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabUnreadBadgeOnDark: {
    borderColor: '#111',
  },
  tabUnreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 11,
  },
  tabItemNearCenterLeft: {
    marginRight: 10,
  },
  tabItemNearCenterRight: {
    marginLeft: 10,
  },
  tabLabel: {
    ...Typography.label,
    marginTop: 1,
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '500',
  },
  tabLabelOnDark: {
    color: 'rgba(255,255,255,0.62)',
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  scanTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});
