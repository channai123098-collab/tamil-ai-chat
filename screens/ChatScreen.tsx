import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
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
import { sendMessage, Message, generateImage, listCloudinaryImages } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

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
    ? (persona.greeting?.trim() || `வணக்கம்! நான் ${persona.name}. என்ன கதைக்கணும்? 😊`)
    : 'வணக்கம்! நான் Tamil AI. என்ன உதவி செய்யட்டும்? 😊';

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: welcome, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [generatingPhoto, setGeneratingPhoto] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(persona?.avatarPhotoUri);
  const [fullViewImg, setFullViewImg] = useState<string | null>(null);

  // Cloudinary viewer state (kept for My Cloud photos)
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

  const pickAvatarPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission', 'Gallery permission வேணும்'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0] && persona) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      try {
        const saved = await AsyncStorage.getItem(`persona_edit_${persona.id}`);
        const data = saved ? JSON.parse(saved) : {};
        data.avatarPhotoUri = uri;
        await AsyncStorage.setItem(`persona_edit_${persona.id}`, JSON.stringify(data));
      } catch {}
    }
  };

  useLayoutEffect(() => {
    if (!persona) return;
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          <TouchableOpacity onPress={pickAvatarPhoto} style={styles.headerAvatarBtn}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.headerAvatarImg} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: persona.avatarColor }]}>
                <Text style={styles.headerAvatarText}>{persona.avatarLetter || persona.emoji}</Text>
              </View>
            )}
            <View style={styles.headerCamBadge}>
              <Text style={{ fontSize: 8 }}>📷</Text>
            </View>
          </TouchableOpacity>
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
  }, [persona, navigation, avatarUri]);

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

  const handleGeneratePhoto = async () => {
    if (!persona) return;
    setShowGenModal(false);
    setGeneratingPhoto(true);

    const loadingId = Date.now().toString();
    const loadingMsg: Message = {
      id: loadingId,
      role: 'assistant',
      content: '🎨 Stable Horde-ல் photo generate பண்றேன்... (1-3 நிமிஷம் ஆகலாம்)',
      timestamp: new Date(),
      imageLoading: true,
    };
    setMessages(prev => [...prev, loadingMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await generateImage({
        imgFace: persona.faceDesc,
        imgBody: persona.bodyDesc,
        imgAttire: persona.attireDesc,
        imagePrompt: genPrompt.trim() || undefined,
        personaName: persona.name,
        mode: 'single',
      });

      const dataUri = `data:${result.mimeType};base64,${result.b64_json}`;
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: '📸 Photo ready! Tap to view full screen.', imageLoading: false, imageUrl: dataUri }
          : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: `❌ Generate பண்ண முடியல:\n${err?.message || 'Try again'}`, imageLoading: false }
          : m
      ));
    } finally {
      setGeneratingPhoto(false);
      setGenPrompt('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && persona && (
          <View style={styles.avatar}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              : <Text style={styles.avatarEmoji}>{persona.avatarLetter || persona.emoji}</Text>
            }
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {item.imageLoading ? (
            <View style={styles.imgLoadingWrap}>
              <ActivityIndicator color="#075E54" size="small" />
              <Text style={styles.msgText}>{item.content}</Text>
            </View>
          ) : item.imageUrl ? (
            <TouchableOpacity onPress={() => setFullViewImg(item.imageUrl!)}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.generatedImg}
                resizeMode="cover"
              />
              <Text style={[styles.msgText, { marginTop: 4 }]}>{item.content}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.msgText}>{item.content}</Text>
          )}
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
              onPress={() => setShowGenModal(true)}
              disabled={generatingPhoto}
            >
              {generatingPhoto
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

      {/* ── Stable Horde Generate Modal ── */}
      <Modal
        visible={showGenModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHandle} />
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>🎨 AI Photo Generate</Text>
                <TouchableOpacity onPress={() => setShowGenModal(false)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {persona && (
                <View style={styles.pickerCharInfo}>
                  <Text style={styles.pickerCharText}>
                    👤 {persona.name} — Stable Horde (Free) மூலம் AI photo உருவாக்கும்
                  </Text>
                </View>
              )}
              <View style={{ padding: 16 }}>
                <Text style={styles.genLabel}>Scene / Pose (optional)</Text>
                <TextInput
                  style={styles.genInput}
                  value={genPrompt}
                  onChangeText={setGenPrompt}
                  placeholder="e.g. sitting on bed, smiling..."
                  placeholderTextColor="#aaa"
                  multiline
                />
                <Text style={styles.genHint}>
                  Empty-ஆ விட்டா character default pose-ல் generate ஆகும்
                </Text>
                <TouchableOpacity
                  style={styles.genBtn}
                  onPress={handleGeneratePhoto}
                  disabled={generatingPhoto}
                >
                  <Text style={styles.genBtnText}>🎨 Generate Photo</Text>
                </TouchableOpacity>
                <Text style={styles.genNote}>
                  ⏱ 1-3 நிமிஷம் ஆகலாம் — Stable Horde free queue
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Full-screen Image Viewer ── */}
      <Modal
        visible={!!fullViewImg}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullViewImg(null)}
      >
        <View style={styles.viewerBg}>
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setFullViewImg(null)}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {fullViewImg && (
            <Image
              source={{ uri: fullViewImg }}
              style={styles.viewerImg}
              resizeMode="contain"
            />
          )}
        </View>
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
  headerAvatarBtn: { position: 'relative', marginRight: 8 },
  headerAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  headerCamBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#fff', borderRadius: 8,
    width: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc',
  },
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
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1, marginBottom: 2, overflow: 'hidden' },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  avatarEmoji: { fontSize: 18 },
  imgLoadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  generatedImg: { width: 220, height: 280, borderRadius: 8, marginBottom: 4 },
  // Generate modal
  genLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  genInput: { backgroundColor: '#f8f8f8', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', padding: 12, fontSize: 14, color: '#222', minHeight: 70, textAlignVertical: 'top', marginBottom: 6 },
  genHint: { fontSize: 12, color: '#aaa', marginBottom: 16 },
  genBtn: { backgroundColor: '#075E54', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  genBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  genNote: { fontSize: 12, color: '#888', textAlign: 'center' },
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
