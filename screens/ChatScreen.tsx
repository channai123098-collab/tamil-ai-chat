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
import { sendMessage, Message, listCloudinaryImages } from '../services/api';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavProp = StackNavigationProp<RootStackParamList, 'Chat'>;
interface Props { route: ChatRouteProp; navigation: ChatNavProp; }

const { width, height } = Dimensions.get('window');

const PHOTO_STYLES = [
  { id: 'normal',     label: 'Normal Photo 📷',               folder: 'Normal Photo' },
  { id: 'nude',       label: 'Nude / நேரடி நிர்வாணம் 🔞',    folder: 'Nude' },
  { id: 'seminude',   label: 'Semi-nude / அரை நிர்வாணம்',    folder: 'Semi Nude' },
  { id: 'breast',     label: 'மார்பை காட்டு / Breast show',  folder: 'Breast Show' },
  { id: 'cleavage',   label: 'Cleavage / மார்பு பிளவு',      folder: 'Cleavage' },
  { id: 'halfbreast', label: 'Half Breast / மொலை பாதி',      folder: 'Half Breast' },
  { id: 'lingerie',   label: 'Lingerie / உள்ளாடை',           folder: 'Lingerie' },
  { id: 'seductive',  label: 'Seductive pose / கவர்ச்சி',    folder: 'Seductive' },
  { id: 'wet',        label: 'Wet clothes / நனைந்த உடை',     folder: 'Wet Clothes' },
  { id: 'legs',       label: 'Legs Spread / கால் விரித்து',  folder: 'Legs Spread' },
  { id: 'saree',      label: 'சேலை தூக்கி காட்டு',           folder: 'Saree' },
  { id: 'sleeping',   label: 'தூங்கும் போது / Sleeping',     folder: 'Sleeping' },
  { id: 'highslit',   label: 'High Slit',                     folder: 'High Slit' },
  { id: 'buttocks',   label: 'Buttocks',                      folder: 'Buttocks' },
  { id: 'lowneck',    label: 'Low Neckline',                  folder: 'Low Neckline' },
];

interface CloudImg { url: string; public_id: string; }

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
  const [fetchingImages, setFetchingImages] = useState(false);

  // Image viewer state
  const [viewerImages, setViewerImages] = useState<CloudImg[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerStyle, setViewerStyle] = useState('');
  const [showViewer, setShowViewer] = useState(false);

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

  const handleStyleSelect = async (style: typeof PHOTO_STYLES[0]) => {
    setShowStylePicker(false);
    setFetchingImages(true);

    const characterName = persona?.name || 'Unknown';
    const folder = `My AI Girls/${style.folder}/${characterName}`;

    try {
      const imgs = await listCloudinaryImages(folder);
      if (!imgs || imgs.length === 0) {
        Alert.alert(
          '📂 Photos இல்லை',
          `My Cloud-ல் "${style.folder} → ${characterName}" folder-ல் photos இல்லை.\n\nMy Cloud app-ல் upload பண்ணுங்க!`,
          [{ text: 'OK' }]
        );
        return;
      }
      setViewerImages(imgs);
      setViewerIndex(0);
      setViewerStyle(`${style.label} — ${characterName}`);
      setShowViewer(true);

      const chatMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📸 ${style.label} — ${imgs.length} photos found! Viewer open ஆச்சு ✅`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, chatMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      Alert.alert('பிழை', `Photos fetch ஆகல: ${err?.message || 'Try again'}`);
    } finally {
      setFetchingImages(false);
    }
  };

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

  const currentImg = viewerImages[viewerIndex];

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
              disabled={fetchingImages}
            >
              {fetchingImages
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

      {/* ── Photo Style Picker Modal ── */}
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
            {persona && (
              <View style={styles.pickerCharInfo}>
                <Text style={styles.pickerCharText}>
                  👤 {persona.name} — My Cloud-ல் இருந்து photos fetch ஆகும்
                </Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {PHOTO_STYLES.map(style => (
                <TouchableOpacity
                  key={style.id}
                  style={styles.styleRow}
                  onPress={() => handleStyleSelect(style)}
                >
                  <Text style={styles.styleArrow}>📂</Text>
                  <Text style={styles.styleLabel}>{style.label}</Text>
                  <Text style={styles.styleChevron}>›</Text>
                </TouchableOpacity>
              ))}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Image Viewer Modal ── */}
      <Modal
        visible={showViewer}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowViewer(false)}
      >
        <View style={styles.viewerBg}>
          {/* Header */}
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setShowViewer(false)} style={styles.viewerClose}>
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>{viewerStyle}</Text>
            <Text style={styles.viewerCount}>
              {viewerImages.length > 0 ? `${viewerIndex + 1} / ${viewerImages.length}` : ''}
            </Text>
          </View>

          {/* Image */}
          <View style={styles.viewerImgWrap}>
            {currentImg ? (
              <Image
                source={{ uri: currentImg.url }}
                style={styles.viewerImg}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator color="#fff" size="large" />
            )}
          </View>

          {/* Navigation */}
          <View style={styles.viewerNav}>
            <TouchableOpacity
              style={[styles.navBtn, viewerIndex === 0 && styles.navBtnDisabled]}
              onPress={() => setViewerIndex(i => Math.max(0, i - 1))}
              disabled={viewerIndex === 0}
            >
              <Text style={styles.navBtnText}>‹ Prev</Text>
            </TouchableOpacity>

            <View style={styles.navCounter}>
              <Text style={styles.navCounterText}>
                Image {viewerImages.length > 0 ? viewerIndex + 1 : 0} of {viewerImages.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.navBtn, viewerIndex >= viewerImages.length - 1 && styles.navBtnDisabled]}
              onPress={() => setViewerIndex(i => Math.min(viewerImages.length - 1, i + 1))}
              disabled={viewerIndex >= viewerImages.length - 1}
            >
              <Text style={styles.navBtnText}>Next ›</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, marginBottom: 2 },
  avatarEmoji: { fontSize: 18 },
  bubble: { maxWidth: '75%', borderRadius: 10, padding: 10, paddingBottom: 6, elevation: 1 },
  userBubble: { backgroundColor: '#DCF8C6', borderTopRightRadius: 2 },
  aiBubble: { backgroundColor: '#fff', borderTopLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 22, color: '#111' },
  timeText: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 3 },
  loadingRow: { flexDirection: 'row', padding: 8, paddingLeft: 14 },
  loadingBubble: { backgroundColor: '#fff', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#075E54', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: '#ddd', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 120, color: '#111', borderWidth: 1, borderColor: '#ddd' },
  btnStack: { flexDirection: 'column', gap: 6, alignItems: 'center' },
  cameraBtn: { backgroundColor: '#E53935', width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  cameraIcon: { fontSize: 18 },
  sendBtn: { backgroundColor: '#25D366', width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sendBtnDisabled: { backgroundColor: '#a8d5b5' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // Style Picker
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 10, maxHeight: '85%' },
  pickerHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerTitle: { fontSize: 17, fontWeight: 'bold', color: '#111' },
  pickerClose: { fontSize: 20, color: '#888', padding: 4 },
  pickerCharInfo: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 10, marginTop: 10 },
  pickerCharText: { color: '#2e7d32', fontSize: 13 },
  styleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f2f2f2', gap: 12 },
  styleArrow: { fontSize: 18 },
  styleLabel: { fontSize: 15, color: '#222', flex: 1 },
  styleChevron: { fontSize: 20, color: '#aaa' },
  // Image Viewer
  viewerBg: { flex: 1, backgroundColor: '#000' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#111' },
  viewerClose: { padding: 8, marginRight: 8 },
  viewerCloseText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  viewerTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  viewerCount: { color: '#aaa', fontSize: 13, marginLeft: 8 },
  viewerImgWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImg: { width, height: height * 0.72 },
  viewerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#111' },
  navBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  navBtnDisabled: { backgroundColor: '#333' },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  navCounter: { alignItems: 'center' },
  navCounterText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
