import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import FaceSwapScreen from './screens/FaceSwapScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Persona } from './screens/HomeScreen';

export type RootStackParamList = {
  Home: undefined;
  Chat: { provider: string; providerLabel: string; persona?: Persona };
  GroupChat: { personas: Persona[] };
  FaceSwap: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#075E54" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#075E54' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params.persona?.name ?? route.params.providerLabel,
            })}
          />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={{ title: 'Group Chat 👥' }}
          />
          <Stack.Screen
            name="FaceSwap"
            component={FaceSwapScreen}
            options={{ title: 'Face Swap 🤳' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings ⚙️' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
