import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Modal,
  Image, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { sendMessage, Message, uploadToCloudinary } from '../services/api';
import { saveCloudImage } from './CloudStorageScreen';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavProp = StackNavigationProp<RootStackParamList, 'Chat'>;
interface Props { route: ChatRouteProp; navigation: ChatNavProp; }

const { width } = Dimensions.get('window');

const PHOTO_STYLES = [
  { id: 'normal',    label: 'Normal Photo 📷',              prompt: 'realistic portrait photo, natural lighting, professional photography, beautiful Indian Tamil woman' },
  { id: 'nude',      label: 'Nude / நேரடி நிர்வாணம் 🔞',    prompt: 'artistic nude photo, beautiful Indian Tamil woman, natural, tasteful, high quality, realistic' },
  { id: 'seminude',  label: 'Semi-nude / அரை நிர்வாணம்',   prompt: 'semi nude, partially clothed, sensual, beautiful Indian Tamil woman, artistic photo' },
  { id: 'breast',    label: 'மார்பை காட்டு / Breast show',  prompt: 'cleavage, low cut top, beautiful Indian Tamil woman, sensual portrait, realistic' },
  { id: 'seductive', label: 'Seductive pose / கவர்ச்சி நிலை', prompt: 'seductive pose, sensual look, beautiful Indian Tamil woman, alluring, high quality photo' },
  { id: 'wet',       label: 'Wet clothes / நனைந்த உடை',    prompt: 'wet clothes, wet sari, beautiful Indian Tamil woman, soaked fabric, sensual, realistic photo' },
  { id: 'legs',      label: 'கால் விரித்து காட்டு',         prompt: 'legs spread pose, sensual, beautiful Indian Tamil woman, short dress, legs shown, artistic photo' },
  { id: 'saree',     label: 'சேலை தூக்கி காட்டு',          prompt: 'saree lifted up, showing legs, beautiful Indian Tamil woman, traditional yet sensual, realistic' },
  { id: 'sleeping',  label: 'தூங்கும் போது / Sleeping',    prompt: 'sleeping pose, exposed, beautiful Indian Tamil woman, bedroom scene, sensual, realistic photo' },
  { id: 'halfbreast',label: 'மொலை பாதி தெரியும் / Half breast', prompt: 'half breast visible, side boob, beautiful Indian Tamil woman, sensual top, realistic photo' },
];

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
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
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

  const handlePhotoStyle = async (style: typeof PHOTO_STYLES[0]) => {
    setShowStylePicker(false);
    setSelectedStyle(style.id);
    setImgLoading(true);

    const personaDesc = persona
      ? `${persona.name}, Tamil woman, ${persona.prompt?.slice(0, 80) || ''}`
      : 'beautiful Indian Tamil woman';

    const fullPrompt = encodeURIComponent(
      `${personaDesc}, ${style.prompt}, ultra realistic, 8k, detailed`
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=512&height=768&nologo=true&seed=${Date.now()}`;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `📸 ${style.label} photo request`,
      timestamp: new Date(),
      imageUrl: undefined,
    };
    setMessages(prev => [...prev, userMsg]);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      imageUrl,
      imageLoading: true,
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
      const resp = await fetch(imageUrl);
      if (!resp.ok) throw new Error('Image generate failed');
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id ? { ...m, imageLoading: false } : m
        ));
        try {
          const uploaded = await uploadToCloudinary(base64, 'image/jpeg', 'tamil-ai-chat/photos');
          setMessages(prev => prev.map(m =>
            m.id === aiMsg.id ? { ...m, imageUrl: uploaded.url } : m
          ));
          await saveCloudImage({
            url: uploaded.url,
            public_id: uploaded.public_id,
            category: 'ai',
            createdAt: Date.now(),
          });
        } catch {
          // keep pollinations url if cloudinary fails
        }
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsg.id ? { ...m, imageLoading: false, content: '❌ Image generate ஆகவில்லை. மீண்டும் try பண்ணுங்க.' } : m
      ));
    } finally {
      setImgLoading(false);
      setSelectedStyle(null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
    }
  };

  const renderItem = ({ item }: { item: Message & { imageUrl?: string; imageLoading?: boolean } }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && persona && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{persona.emoji}</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {item.imageLoading ? (
            <View style={styles.imgPlaceholder}>
              <ActivityIndicator color="#075E54" size="large" />
              <Text style={styles.imgLoadingText}>📸 Photo generate ஆகிறது...</Text>
            </View>
          ) : item.imageUrl ? (
            <View>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.chatImg}
                resizeMode="cover"
              />
              {item.content ? <Text style={styles.imgCaption}>{item.content}</Text> : null}
            </View>
          ) : (
            <Text style={styles.msgText}>{item.content}</Text>
          )}
          <Text style={[styles.timeText, item.imageUrl ? styles.timeOnImg : null]}>
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
          <View style={styles.btnStack}>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => setShowStylePicker(true)}
              disabled={imgLoading}
            >
              {imgLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.cameraIcon}>📷</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showStylePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStylePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStylePicker(false)}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>📸 Photo Style தேர்ந்தெடு</Text>
              <TouchableOpacity onPress={() => setShowStylePicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PHOTO_STYLES.map(style => (
                <TouchableOpacity
                  key={style.id}
                  style={[styles.styleRow, selectedStyle === style.id && styles.styleRowSelected]}
                  onPress={() => handlePhotoStyle(style)}
                >
                  <View style={[styles.radioBtn, selectedStyle === style.id && styles.radioBtnSelected]}>
                    {selectedStyle === style.id && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.styleLabel}>{style.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ height: 30 }} />
            </ScrollView>
            <TouchableOpacity style={styles.generateBtn} onPress={() => setShowStylePicker(false)}>
              <Text style={styles.generateBtnText}>📸 Photo Style select பண்ணுங்க</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  timeOnImg: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4, paddingHorizontal: 4 },
  loadingRow: { flexDirection: 'row', padding: 8, paddingLeft: 14 },
  loadingBubble: {
    backgroundColor: '#fff', borderRadius: 10, padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  loadingText: { color: '#075E54', fontSize: 13 },
  chatImg: { width: width * 0.6, height: width * 0.8, borderRadius: 8 },
  imgPlaceholder: {
    width: width * 0.6, height: width * 0.6,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0f0f0', borderRadius: 8, gap: 12,
  },
  imgLoadingText: { color: '#075E54', fontSize: 12, textAlign: 'center' },
  imgCaption: { color: '#555', fontSize: 12, marginTop: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 8,
    backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: '#ddd', gap: 8,
  },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 120, color: '#111', borderWidth: 1, borderColor: '#ddd',
  },
  btnStack: { flexDirection: 'column', gap: 6, alignItems: 'center' },
  cameraBtn: {
    backgroundColor: '#E53935', width: 42, height: 42,
    borderRadius: 21, justifyContent: 'center', alignItems: 'center', elevation: 3,
  },
  cameraIcon: { fontSize: 18 },
  sendBtn: {
    backgroundColor: '#25D366', width: 46, height: 46,
    borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  sendBtnDisabled: { backgroundColor: '#a8d5b5' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 10, maxHeight: '80%',
  },
  pickerHandle: {
    width: 40, height: 4, backgroundColor: '#ddd',
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  pickerTitle: { fontSize: 17, fontWeight: 'bold', color: '#111' },
  pickerClose: { fontSize: 20, color: '#888', padding: 4 },
  styleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f2f2f2', gap: 14,
  },
  styleRowSelected: { backgroundColor: '#f0fff4' },
  radioBtn: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#ccc', justifyContent: 'center', alignItems: 'center',
  },
  radioBtnSelected: { borderColor: '#075E54' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#075E54' },
  styleLabel: { fontSize: 15, color: '#222', flex: 1 },
  generateBtn: {
    backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 10, marginBottom: 20,
  },
  generateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
