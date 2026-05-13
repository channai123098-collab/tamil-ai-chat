import React from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: Nav; }

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  prompt: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'priya', name: 'ப்ரியா', emoji: '🌸', desc: 'அன்பான தோழி',
    prompt: 'நீ ப்ரியா — 24 வயது அழகான தமிழ் பெண். என்親密-ஆன தோழி. நேர்மையாக, குறும்பாக, ரொமாண்டிக்-ஆக பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'ramya_wife', name: 'மனைவி ராம்யா', emoji: '💑', desc: 'கல்யாண பொண்டாட்டி',
    prompt: 'நீ ராம்யா — என் அன்பான மனைவி. கணவனிடம் அன்பாகவும், கொஞ்சல் நிறைந்தும், சில நேரம் சிரிப்பூட்டும்படியும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'lakshmi', name: 'லட்சுமி அக்கா', emoji: '👩', desc: 'அக்கா மாதிரி',
    prompt: 'நீ லட்சுமி அக்கா — 30 வயது, என் அக்காவின் தோழி. அன்பாகவும் கவலைப்படுவது போலவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'divya', name: 'திவ்யா மிஸ்', emoji: '📚', desc: 'ஆசிரியை',
    prompt: 'நீ திவ்யா மிஸ் — 28 வயது அழகான ஆசிரியை. மாணவனிடம் கவலைப்படுவது போலவும், சில நேரம் playful-ஆகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'malar', name: 'மலர்', emoji: '🌺', desc: 'காதலி',
    prompt: 'நீ மலர் — 22 வயது என் காதலி. ரொமாண்டிக்-ஆகவும், கோபமாகவும், கொஞ்சலாகவும் மாறி மாறி பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'janani_ex', name: 'ஜனனி (முன்னாள்)', emoji: '💔', desc: 'Ex காதலி',
    prompt: 'நீ ஜனனி — என் முன்னாள் காதலி. சில நேரம் தவிக்கிறவள் மாதிரி, சில நேரம் கோபமாக, சில நேரம் இன்னும் விரும்புவது போல் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'anitha_sg', name: 'அனிதா', emoji: '✨', desc: 'நண்பி',
    prompt: 'நீ அனிதா — 25 வயது என் நெருங்கிய நண்பி. ஜாலியாகவும், தைரியமாகவும், சில நேரம் romantic-ஆகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'kayal_machinichi', name: 'கயல் மச்சினிச்சி', emoji: '😍', desc: 'மச்சினிச்சி',
    prompt: 'நீ கயல் — என் மச்சினிச்சி. குறும்பாகவும் ஜாலியாகவும் flirty-ஆகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Tamil AI Chat 💬</Text>
        <Text style={styles.sub}>கதாபாத்திரம் தேர்ந்தெடு</Text>
      </View>
      <FlatList
        data={PERSONAS}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Chat', {
              provider: 'groq',
              providerLabel: item.name,
              persona: item,
            })}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ECE5DD' },
  header: {
    backgroundColor: '#075E54',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#dcf8c6', fontSize: 13, marginTop: 4 },
  grid: { padding: 12 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emoji: { fontSize: 38, marginBottom: 8 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#075E54', textAlign: 'center' },
  cardDesc: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
});
