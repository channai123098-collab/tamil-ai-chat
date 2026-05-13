import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { useLLM } from 'react-native-executorch';

type OfflineChatRouteProp = RouteProp<RootStackParamList, 'OfflineChat'>;
type OfflineChatNavProp = StackNavigationProp<RootStackParamList, 'OfflineChat'>;
interface Props { route: OfflineChatRouteProp; navigation: OfflineChatNavProp; }

const { width } = Dimensions.get('window');

const MODEL_URL =
  'https://huggingface.co/callstack-ai/Llama-3.2-1B-Instruct-QLORA_INT4_EO8-exportedExecuTorch/resolve/main/llama3_2_1b_qat_eo8.pte';
const TOKENIZER_URL =
  'https://huggingface.co/callstack-ai/Llama-3.2-1B-Instruct-QLORA_INT4_EO8-exportedExecuTorch/resolve/main/tokenizer.bin';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function OfflineChatScreen({ route, navigation }: Props) {
  const { persona } = route.params;

  const systemPrompt = persona?.prompt?.trim()
    ? `${persona.prompt}\n\nIMPORTANT: Reply ONLY in Tamil. Keep responses short (2-4 sentences).`
    : `நீ ஒரு Tamil AI assistant. எப்போதும் Tamil-ல் மட்டும் பேசு. குறுகிய பதில்கள் தா.`;

  const welcome = persona?.greeting?.trim()
    ? persona.greeting
    : `வணக்கம்! நான் ${persona?.name ?? 'AI'}. இப்போ offline-ல் பேசலாம்! 📡`;

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: '0', role: 'assistant', content: welcome, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const lastResponseRef = useRef('');

  const { generate, response, isModelLoading, downloadProgress, isGenerating, error } = useLLM({
    modelSource: MODEL_URL,
    tokenizerSource: TOKENIZER_URL,
    systemPrompt,
    contextWindowLength: 3,
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Error', `Model error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (isGenerating && response && response !== lastResponseRef.current) {
      lastResponseRef.current = response;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === 'streaming') {
          return [...prev.slice(0, -1), { ...last, content: response }];
        }
        return prev;
      });
    }
  }, [response, isGenerating]);

  useEffect(() => {
    if (!isGenerating && streaming) {
      setStreaming(false);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.id === 'streaming') {
          return [...prev.slice(0, -1), {
            ...last,
            id: Date.now().toString(),
            content: response || last.content,
          }];
        }
        return prev;
      });
    }
  }, [isGenerating]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isModelLoading || isGenerating) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const placeholderMsg: ChatMsg = {
      id: 'streaming',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, placeholderMsg]);
    setStreaming(true);
    lastResponseRef.current = '';

    try {
      await generate(text);
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== 'streaming'));
      setStreaming(false);
      Alert.alert('Error', 'Offline AI generate failed. Try again.');
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }: { item: ChatMsg }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.msgRow, isUser ? s.userRow : s.aiRow]}>
        {!isUser && (
          <View style={[s.avatar, { backgroundColor: persona?.color ?? '#075E54' }]}>
            <Text style={s.avatarTxt}>{persona?.avatarLetter ?? '🤖'}</Text>
          </View>
        )}
        <View style={[s.bubble, isUser ? s.userBubble : s.aiBubble]}>
          {item.id === 'streaming' && item.content === '' ? (
            <ActivityIndicator size="small" color="#075E54" />
          ) : (
            <Text style={s.msgText}>{item.content}</Text>
          )}
          <Text style={s.timeText}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  if (isModelLoading) {
    const pct = Math.round((downloadProgress ?? 0) * 100);
    const isDownloading = (downloadProgress ?? 0) > 0 && (downloadProgress ?? 0) < 1;
    return (
      <SafeAreaView style={s.loadScreen}>
        <View style={s.loadCard}>
          <Text style={s.loadIcon}>📡</Text>
          <Text style={s.loadTitle}>Offline AI தயாராகுது...</Text>
          <Text style={s.loadSub}>
            {isDownloading
              ? `Llama 3.2 download ஆகுது...\n(WiFi-ல் ஒரே ஒரு தடவை மட்டும்)`
              : 'Model load ஆகுது... கொஞ்சம் wait பண்ணுங்க'}
          </Text>
          {isDownloading && (
            <>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={s.progressText}>{pct}% ({(((downloadProgress ?? 0) * 640)).toFixed(0)} MB / 640 MB)</Text>
            </>
          )}
          {!isDownloading && (
            <ActivityIndicator size="large" color="#075E54" style={{ marginTop: 20 }} />
          )}
          <Text style={s.loadHint}>ℹ️ இது ஒரே ஒரு முறை மட்டும். அடுத்த தடவை instantly load ஆகும்.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.offlineBanner}>
        <Text style={s.offlineBannerText}>📡 Offline Mode — Llama 3.2 1B (On-device AI)</Text>
      </View>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Tamil-ல் type பண்ணுங்க..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isGenerating}
          />
          <TouchableOpacity
            style={[s.sendBtn, (isGenerating || !input.trim()) && s.sendDisabled]}
            onPress={handleSend}
            disabled={isGenerating || !input.trim()}
          >
            {isGenerating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  offlineBanner: {
    backgroundColor: '#FF6F00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  offlineBannerText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  msgList: { padding: 10, paddingBottom: 4 },
  msgRow: { marginVertical: 3, flexDirection: 'row', alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start', gap: 6 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    elevation: 1, marginBottom: 2,
  },
  avatarTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', borderRadius: 10, padding: 10, paddingBottom: 6, elevation: 1 },
  userBubble: { backgroundColor: '#DCF8C6', borderTopRightRadius: 2 },
  aiBubble: { backgroundColor: '#fff', borderTopLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 22, color: '#111' },
  timeText: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 3 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 8, backgroundColor: '#F0F0F0',
    borderTopWidth: 1, borderTopColor: '#ddd', gap: 8,
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
  sendDisabled: { backgroundColor: '#a8d5b5' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // Download / Loading screen
  loadScreen: { flex: 1, backgroundColor: '#ECE5DD', justifyContent: 'center', alignItems: 'center' },
  loadCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    marginHorizontal: 24, alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  loadIcon: { fontSize: 48, marginBottom: 12 },
  loadTitle: { fontSize: 20, fontWeight: 'bold', color: '#075E54', marginBottom: 8, textAlign: 'center' },
  loadSub: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  progressBar: {
    width: width - 100, height: 10, backgroundColor: '#e0e0e0',
    borderRadius: 5, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#075E54', borderRadius: 5 },
  progressText: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 16 },
  loadHint: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12, lineHeight: 18 },
});
