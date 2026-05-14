import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { sendMessage } from '../services/api';
import { Persona } from './HomeScreen';

type GroupRouteProp = RouteProp<RootStackParamList, 'GroupChat'>;
interface Props { route: GroupRouteProp; }

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  persona?: Persona;
  content: string;
  timestamp: Date;
}

export default function GroupChatScreen({ route }: Props) {
  const { personas } = route.params;
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0', role: 'assistant',
      persona: personas[0],
      content: `வணக்கம்! நாங்கள் ${personas.map(p => p.name).join(', ')} — எல்லாரும் இங்க இருக்கோம்! 😊`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    historyRef.current.push({ role: 'user', content: text });
    try {
      for (const persona of personas) {
        const systemPrompt = persona.prompt + '\n\nநீ ஒரு group chat-ல் இருக்கிறாய். மற்ற characters-ம் இருக்காங்க. Short-ஆ reply பண்ணு.';
        const reply = await sendMessage([...historyRef.current], 'gemini', systemPrompt);
        const aiMsg: Msg = { id: `${Date.now()}-${persona.id}`, role: 'assistant', persona, content: reply, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        historyRef.current.push({ role: 'assistant', content: `${persona.name}: ${reply}` });
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (err: any) {
      Alert.alert('பிழை', err?.message || 'பதில் வரவில்லை');
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, personas]);

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.row, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && item.persona && (
          <View style={[styles.avatar, { backgroundColor: item.persona.avatarColor }]}>
            <Text style={styles.avatarTxt}>{item.persona.emoji}</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {!isUser && item.persona && (
            <Text style={[styles.senderName, { color: item.persona.avatarColor }]}>{item.persona.name}</Text>
          )}
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.timeTxt}>
            {item.timestamp.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.groupBar}>
        {personas.slice(0, 5).map(p => (
          <View key={p.id} style={[styles.miniAvatar, { backgroundColor: p.avatarColor }]}>
            <Text style={styles.miniAvatarTxt}>{p.emoji}</Text>
          </View>
        ))}
        <Text style={styles.groupBarTxt}>{personas.length} members</Text>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#075E54" />
            <Text style={styles.loadingTxt}>அனைவரும் reply பண்றாங்க...</Text>
          </View>
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Group-ல் message அனுப்பு..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  flex: { flex: 1 },
  groupBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#128C7E', paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  miniAvatarTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  groupBarTxt: { color: '#dcf8c6', fontSize: 12, marginLeft: 4 },
  msgList: { padding: 10 },
  row: { marginVertical: 3, flexDirection: 'row', alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start', gap: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  bubble: { maxWidth: '72%', borderRadius: 10, padding: 10, paddingBottom: 6, elevation: 1 },
  userBubble: { backgroundColor: '#DCF8C6', borderTopRightRadius: 2 },
  aiBubble: { backgroundColor: '#fff', borderTopLeftRadius: 2 },
  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  msgText: { fontSize: 14, lineHeight: 20, color: '#111' },
  timeTxt: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 3 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingLeft: 14 },
  loadingTxt: { color: '#075E54', fontSize: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: '#ddd', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100, color: '#111', borderWidth: 1, borderColor: '#ddd' },
  sendBtn: { backgroundColor: '#25D366', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sendBtnDisabled: { backgroundColor: '#a8d5b5' },
  sendIcon: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
