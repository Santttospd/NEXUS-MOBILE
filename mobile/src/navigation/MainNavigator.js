import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

// Screens
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { FinanceiroScreen } from '../screens/financeiro/FinanceiroScreen';
import { TaxaDetalheScreen } from '../screens/financeiro/TaxaDetalheScreen';
import { OcorrenciasScreen } from '../screens/ocorrencias/OcorrenciasScreen';
import { OcorrenciaDetalheScreen } from '../screens/ocorrencias/OcorrenciaDetalheScreen';
import { NovaOcorrenciaScreen } from '../screens/ocorrencias/NovaOcorrenciaScreen';
import { ReservasScreen } from '../screens/reservas/ReservasScreen';
import { NovaReservaScreen } from '../screens/reservas/NovaReservaScreen';
import { PerfilScreen } from '../screens/perfil/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'NEXUS' }} />
    </Stack.Navigator>
  );
}

function FinanceiroStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Financeiro" component={FinanceiroScreen} options={{ title: 'Financeiro' }} />
      <Stack.Screen name="TaxaDetalhe" component={TaxaDetalheScreen} options={{ title: 'Detalhe da Taxa' }} />
    </Stack.Navigator>
  );
}

function OcorrenciasStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Ocorrencias" component={OcorrenciasScreen} options={{ title: 'Ocorrências' }} />
      <Stack.Screen name="OcorrenciaDetalhe" component={OcorrenciaDetalheScreen} options={{ title: 'Detalhe' }} />
      <Stack.Screen name="NovaOcorrencia" component={NovaOcorrenciaScreen} options={{ title: 'Nova Ocorrência' }} />
    </Stack.Navigator>
  );
}

function ReservasStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Reservas" component={ReservasScreen} options={{ title: 'Reservas' }} />
      <Stack.Screen name="NovaReserva" component={NovaReservaScreen} options={{ title: 'Nova Reserva' }} />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Stack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: focused ? 'home' : 'home-outline',
            FinanceiroTab: focused ? 'wallet' : 'wallet-outline',
            OcorrenciasTab: focused ? 'alert-circle' : 'alert-circle-outline',
            ReservasTab: focused ? 'calendar' : 'calendar-outline',
            PerfilTab: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Início' }} />
      <Tab.Screen name="FinanceiroTab" component={FinanceiroStack} options={{ title: 'Financeiro' }} />
      <Tab.Screen name="OcorrenciasTab" component={OcorrenciasStack} options={{ title: 'Ocorrências' }} />
      <Tab.Screen name="ReservasTab" component={ReservasStack} options={{ title: 'Reservas' }} />
      <Tab.Screen name="PerfilTab" component={PerfilStack} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
