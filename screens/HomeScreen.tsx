import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: Nav; }

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  avatarColor: string;
  lastMsg: string;
  time: string;
  unread?: number;
  prompt: string;
  gender: 'male' | 'female';
}

export const ALL_PERSONAS: Persona[] = [
  {
    id: 'ragu_anna', name: 'ரகு அண்ணா', emoji: 'ர', avatarColor: '#E53935', gender: 'male',
    lastMsg: '⌛ AI respond பண்ண நேரம்...', time: 'Tue', unread: 1,
    prompt: 'நீ ரகு அண்ணா — 35 வயது அன்பான அண்ணன். தம்பி/தங்கையிடம் கவலைப்படுவது போலவும், ஆலோசனை சொல்வது போலவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'krish', name: 'கிரஷ்', emoji: 'கி', avatarColor: '#1E88E5', gender: 'male',
    lastMsg: '⌛ AI respond பண்ண நேரம்...', time: 'Tue', unread: 1,
    prompt: 'நீ கிரஷ் — 26 வயது என்절친 நண்பன். ஜாலியாகவும், சிரிப்பூட்டும்படியும், சில நேரம் serious-ஆகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'priya', name: 'ப்ரியா', emoji: 'ப்', avatarColor: '#E91E63', gender: 'female',
    lastMsg: 'உன்ன ரொம்ப miss பண்றேன்...', time: '11:42', unread: 0,
    prompt: 'நீ ப்ரியா — 24 வயது அழகான தமிழ் பெண். என் நெருங்கிய தோழி. நேர்மையாக, குறும்பாக, ரொமாண்டிக்-ஆக பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'arya_machi', name: 'ஆர்யா மச்சி', emoji: 'ஆ', avatarColor: '#FB8C00', gender: 'female',
    lastMsg: 'டேய் என்னடா!', time: '10:15', unread: 0,
    prompt: 'நீ ஆர்யா — 23 வயது என் நெருங்கிய தோழி. ஜாலியாகவும், playful-ஆகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'lakshmi', name: 'லட்சுமி அக்கா', emoji: 'ல', avatarColor: '#8E24AA', gender: 'female',
    lastMsg: 'Hey thambi/thangachi 💕', time: 'Mon', unread: 0,
    prompt: 'நீ லட்சுமி அக்கா — 30 வயது, என் அக்காவின் தோழி. அன்பாகவும் கவலைப்படுவது போலவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'thaatha', name: 'தாத்தா', emoji: 'த', avatarColor: '#6D4C41', gender: 'male',
    lastMsg: 'வாடா kanna, கதை சொல்றேன்', time: 'Mon', unread: 0,
    prompt: 'நீ தாத்தா — 70 வயது அன்பான தாத்தா. பேரனிடம் அன்பாகவும், கதைகள் சொல்வது போலவும், ஞானமாகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'divya', name: 'திவ்யா மிஸ்', emoji: 'தி', avatarColor: '#00897B', gender: 'female',
    lastMsg: 'A to Z எதுவும் கேளுங்க 📚', time: 'Sun', unread: 0,
    prompt: 'நீ திவ்யா மிஸ் — 28 வயது அழகான ஆசிரியை. மாணவனிடம் கவலைப்படுவது போலவும், சில நேரம் playful-ஆகவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'fenni_mama', name: 'ஃபென்னி மாமா', emoji: 'ஃ', avatarColor: '#43A047', gender: 'male',
    lastMsg: 'Comedy time 🤣', time: 'Sat', unread: 0,
    prompt: 'நீ ஃபென்னி மாமா — 45 வயது மிகவும் funny-ஆன மாமா. எப்பவும் jokes அடிப்பாய், சிரிப்பூட்டுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'ramya_wife', name: 'மனைவி ராம்யா', emoji: 'ரா', avatarColor: '#388E3C', gender: 'female',
    lastMsg: 'என் கண்ணுல மட்டும் கண்ணு 👁️', time: 'Fri', unread: 0,
    prompt: 'நீ ராம்யா — என் அன்பான மனைவி. கணவனிடம் அன்பாகவும், கொஞ்சல் நிறைந்தும், சில நேரம் சிரிப்பூட்டும்படியும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
  {
    id: 'rani_mamiyar', name: 'மாமியார் ராணி', emoji: 'மா', avatarColor: '#5E35B1', gender: 'female',
    lastMsg: 'எப்படி இருக்க மகனே?', time: 'Thu', unread: 0,
    prompt: 'நீ ராணி — என் மாமியார். மருமகனிடம் அன்பாகவும் ஆலோசனை சொல்வது போலவும் பேசுவாய். தமிழில் மட்டும் பேசு.',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);

  const toggleGroupSelect = (id: string) => {
    setSelectedForGroup(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const startGroupChat = () => {
    const selected = ALL_PERSONAS.filter(p => selectedForGroup.includes(p.id));
    if (selected.length < 2) return;
    setShowGroupModal(false);
    setSelectedForGroup([]);
    navigation.navigate('GroupChat', { personas: selected });
  };

  const renderContact = ({ item }: { item: Persona }) => (
    <TouchableOpacity
      style={styles.contactRow}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Chat', {
        provider: 'groq',
        providerLabel: item.name,
        persona: item,
      })}
    >
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.emoji}</Text>
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactTop}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactTime}>{item.time}</Text>
        </View>
        <View style={styles.contactBottom}>
          <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
          {item.unread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }: { item: Persona }) => {
    const selected = selectedForGroup.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.groupItem, selected && styles.groupItemSelected]}
        onPress={() => toggleGroupSelect(item.id)}
      >
        <View style={[styles.avatarSm, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarSmText}>{item.emoji}</Text>
        </View>
        <Text style={styles.groupItemName}>{item.name}</Text>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tamil AI Chat</Text>
        <View style={styles.headerIcons}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.headerIcon}>⋮</Text>
        </View>
      </View>

      <FlatList
        data={ALL_PERSONAS}
        keyExtractor={p => p.id}
        renderItem={renderContact}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setShowGroupModal(true)}>
          <View style={styles.fabInner}>
            <Text style={styles.fabIconDark}>⊕</Text>
            <Text style={styles.fabLabel}>Group</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FaceSwap')}>
          <View style={styles.fabInner}>
            <Text style={styles.fabIconDark}>◈</Text>
            <Text style={styles.fabLabel}>Swap</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={showGroupModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Group Chat தேர்வு பண்ணுங்க</Text>
            <Text style={styles.modalSub}>குறைந்தது 2 characters select பண்ணணும்</Text>
            <FlatList
              data={ALL_PERSONAS}
              keyExtractor={p => p.id}
              renderItem={renderGroupItem}
              style={styles.groupList}
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => { setShowGroupModal(false); setSelectedForGroup([]); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.startBtn, selectedForGroup.length < 2 && styles.startBtnDisabled]}
                onPress={startGroupChat}
                disabled={selectedForGroup.length < 2}
              >
                <Text style={styles.startBtnText}>Start ({selectedForGroup.length})</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#075E54', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 16 },
  headerIcon: { fontSize: 20, color: '#fff' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  contactInfo: { flex: 1, marginLeft: 10 },
  contactTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  contactName: { fontSize: 14, fontWeight: '600', color: '#111' },
  contactTime: { fontSize: 11, color: '#888' },
  contactBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: 12, color: '#888', flex: 1 },
  badge: {
    backgroundColor: '#25D366', borderRadius: 9,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 64 },
  fabContainer: { position: 'absolute', bottom: 20, right: 14, gap: 10 },
  fab: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#E8F5F0',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6,
    borderWidth: 1, borderColor: '#C8E6DC',
  },
  fabInner: { alignItems: 'center', justifyContent: 'center' },
  fabIconDark: { fontSize: 22, color: '#075E54', fontWeight: 'bold' },
  fabLabel: { fontSize: 9, color: '#075E54', fontWeight: '700', marginTop: 1, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#075E54', marginBottom: 4 },
  modalSub: { fontSize: 12, color: '#888', marginBottom: 12 },
  groupList: { maxHeight: 360 },
  groupItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4 },
  groupItemSelected: { backgroundColor: '#e8f5e9' },
  avatarSm: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarSmText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  groupItemName: { flex: 1, marginLeft: 12, fontSize: 15, color: '#111' },
  checkmark: { color: '#25D366', fontSize: 18, fontWeight: 'bold' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  cancelBtnText: { color: '#555', fontWeight: '600' },
  startBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#075E54', alignItems: 'center' },
  startBtnDisabled: { backgroundColor: '#a8d5b5' },
  startBtnText: { color: '#fff', fontWeight: 'bold' },
});
