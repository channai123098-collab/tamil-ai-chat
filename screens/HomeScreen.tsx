import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const PROVIDERS = [
  {
    id: 'gemini',
    label: 'Gemini AI',
    description: 'Google Gemini - தமிழில் பேசு',
    color: '#25D366',
    icon: '🤖',
  },
  {
    id: 'groq',
    label: 'Groq Gemma2',
    description: 'Groq Fast AI - வேகமான பதில்',
    color: '#128C7E',
    icon: '⚡',
  },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>AI Provider தேர்ந்தெடு</Text>
        <Text style={styles.subText}>உங்களுக்கு பிடித்த AI-யோடு பேசுங்க</Text>
      </View>
      <FlatList
        data={PROVIDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() =>
              navigation.navigate('Chat', {
                provider: item.id,
                providerLabel: item.label,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tamil AI Chat v1.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: {
    backgroundColor: '#075E54',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subText: { color: '#dcf8c6', fontSize: 14, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardIcon: { fontSize: 36, marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#075E54' },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 3 },
  arrow: { fontSize: 28, color: '#25D366', fontWeight: 'bold' },
  footer: { padding: 16, alignItems: 'center' },
  footerText: { color: '#888', fontSize: 12 },
});