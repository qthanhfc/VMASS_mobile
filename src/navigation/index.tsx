import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../theme';

// ─── Param Lists ────────────────────────────────────────────────────────────

export type RootTabParamList = {
  Home: undefined;
  Manage: undefined;
  Messages: undefined;
  Settings: undefined;
};

export type ManageStackParamList = {
  ManageMain: undefined;
  ProductsList: undefined;
  ProductCreate: undefined;
  ProductEdit: { id?: number };
  CustomersList: undefined;
  CustomerEdit: { id?: number };
  OrdersList: undefined;
  OrderDetail: { id: number };
  InventoryMain: undefined;
  InventoryEdit: undefined;
  StaffList: undefined;
  StaffEdit: { id?: number };
  SuppliersList: undefined;
  SupplierEdit: { id?: number };
  ReturnsList: undefined;
  ReturnCreate: undefined;
  PromotionsList: undefined;
  PromotionEdit: { id?: number };
  BookkeepingMain: undefined;
  BookkeepingEntry: undefined;
  TaxMain: undefined;
  EcommerceMain: undefined;
  QrScan: undefined;
  PosScreen: undefined;
};

export type HomeStackParamList = { HomeMain: undefined };
export type MessagesStackParamList = { MessagesMain: undefined };
export type SettingsStackParamList = { SettingsMain: undefined };

// ─── Screen Imports ─────────────────────────────────────────────────────────

import { HomeScreen } from '../screens/home/HomeScreen';
import { ManageScreen } from '../screens/manage/ManageScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProductsListScreen } from '../screens/products/ProductsListScreen';
import { ProductEditScreen } from '../screens/products/ProductEditScreen';
import { CustomersListScreen } from '../screens/customers/CustomersListScreen';
import { CustomerEditScreen } from '../screens/customers/CustomerEditScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { InventoryEditScreen } from '../screens/inventory/InventoryEditScreen';
import { StaffListScreen } from '../screens/staff/StaffListScreen';
import { StaffEditScreen } from '../screens/staff/StaffEditScreen';
import { SuppliersListScreen } from '../screens/suppliers/SuppliersListScreen';
import { SupplierEditScreen } from '../screens/suppliers/SupplierEditScreen';
import { ReturnsListScreen } from '../screens/returns/ReturnsListScreen';
import { ReturnCreateScreen } from '../screens/returns/ReturnCreateScreen';
import { PromotionsListScreen } from '../screens/promotions/PromotionsListScreen';
import { PromotionEditScreen } from '../screens/promotions/PromotionEditScreen';
import { BookkeepingScreen } from '../screens/bookkeeping/BookkeepingScreen';
import { BookkeepingEntryScreen } from '../screens/bookkeeping/BookkeepingEntryScreen';
import { TaxScreen } from '../screens/tax/TaxScreen';
import { EcommerceScreen } from '../screens/ecommerce/EcommerceScreen';
import { QrScanScreen } from '../screens/qr/QrScanScreen';
import { PosScreen } from '../screens/pos/PosScreen';

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
      <ManageStack.Screen name="StaffList" component={StaffListScreen} />
      <ManageStack.Screen name="StaffEdit" component={StaffEditScreen} />
      <ManageStack.Screen name="SuppliersList" component={SuppliersListScreen} />
      <ManageStack.Screen name="SupplierEdit" component={SupplierEditScreen} />
      <ManageStack.Screen name="ReturnsList" component={ReturnsListScreen} />
      <ManageStack.Screen name="ReturnCreate" component={ReturnCreateScreen} />
      <ManageStack.Screen name="PromotionsList" component={PromotionsListScreen} />
      <ManageStack.Screen name="PromotionEdit" component={PromotionEditScreen} />
      <ManageStack.Screen name="BookkeepingMain" component={BookkeepingScreen} />
      <ManageStack.Screen name="BookkeepingEntry" component={BookkeepingEntryScreen} />
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
    </SettingsStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof RootTabParamList, { active: IoniconsName; inactive: IoniconsName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Manage: { active: 'grid', inactive: 'grid-outline' },
  Messages: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  Home: 'Trang chủ',
  Manage: 'Quản lý',
  Messages: 'Tin nhắn',
  Settings: 'Cài đặt',
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof RootTabParamList];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabel: TAB_LABELS[route.name as keyof RootTabParamList],
        tabBarLabelStyle: { ...Typography.label, marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Manage" component={ManageStackNavigator} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  placeholderText: { ...Typography.h3, color: Colors.textSecondary },
});
