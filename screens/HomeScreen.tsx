import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace('Chat', { provider: 'groq', providerLabel: 'Tamil AI Chat' });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#075E54' }}>
      <ActivityIndicator size="large" color="#25D366" />
    </View>
  );
}
