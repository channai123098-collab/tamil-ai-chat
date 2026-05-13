import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { sendMessage, Message } from '../services/api';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavProp = StackNavigationProp<RootStackParamList, 'Chat'>;
interface Props { route: ChatRouteProp; navigation: ChatNavProp; }

export default function ChatScreen({ route, navigation }: Props) {
  const { provider, persona } = route.params;

  const welcome = persona
    ? `வணக்கம்! நான் ${persona.name}. என்ன கதைக்கணும்? 😊`
    : 'வணக்கம்! நான் Tamil AI. என்ன உதவி செய்யட்டும்? 😊';

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: welcome, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const clearChat = () => {
    Alert.alert('Chat Clear பண்ணட்டுமா?', 'அனைத்து messages delete ஆகும்', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: () => setMessages([{ id: '0', role: 'assistant', content: welcome, timestamp: new Date() }]),
      },
    ]);
  };

  useLayoutEffect(() => {
    if (!persona) return;
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          <View style={[styles.headerAvatar, { backgroundColor: persona.avatarColor }]}>
            <Text style={styles.headerAvatarText}>{persona.emoji}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{persona.name}</Text>
            <Text style={styles.headerOnline}>online</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('EditCharacter', { persona: persona! })}
          >
            <Text style={styles.headerBtnIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={clearChat}>
            <Text style={styles.headerBtnIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [persona, navigation]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: text });

      const reply = await sendMessage(history, provider, persona?.prompt);

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch (err: any) {
      Alert.alert('பிழை', err?.message || 'பதில் வரவில்லை. மீண்டும் முயல்க.');
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, messages, provider, persona]);

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && persona && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{persona.emoji}</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.timeText}>
            {item.timestamp.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {loading && (
          <View style={styles.loadingRow}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#075E54" />
              <Text style={styles.loadingText}>
                {persona ? `${persona.name} பதில் அளிக்கிறார்...` : 'பதில் தயாராகிறது...'}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="தமிழில் தட்டச்சு பண்ணுங்க..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
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
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  headerName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  headerOnline: { color: '#b2dfdb', fontSize: 11 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 4 },
  headerBtn: { padding: 6 },
  headerBtnIcon: { fontSize: 18 },
  msgList: { padding: 10, paddingBottom: 4 },
  msgRow: { marginVertical: 3, flexDirection: 'row', alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start', gap: 6 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', justifyContent: 'center',
    alignItems: 'center', elevation: 1, marginBottom: 2,
  },
  avatarEmoji: { fontSize: 18 },
  bubble: { maxWidth: '75%', borderRadius: 10, padding: 10, paddingBottom: 6, elevation: 1 },
  userBubble: { backgroundColor: '#DCF8C6', borderTopRightRadius: 2 },
  aiBubble: { backgroundColor: '#fff', borderTopLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 22, color: '#111' },
  timeText: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 3 },
  loadingRow: { flexDirection: 'row', padding: 8, paddingLeft: 14 },
  loadingBubble: {
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  loadingText: { color: '#075E54', fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 8,
    backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: '#ddd', gap: 8,
  },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 120, color: '#111', borderWidth: 1, borderColor: '#ddd',
  },
  sendBtn: {
    backgroundColor: '#25D366', width: 46, height: 46,
    borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  sendBtnDisabled: { backgroundColor: '#a8d5b5' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
