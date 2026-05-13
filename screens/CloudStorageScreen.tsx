import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  FlatList, Image, Modal, Dimensions, ActivityIndicator,
  Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type Nav = StackNavigationProp<RootStackParamList, 'CloudStorage'>;
interface Props { navigation: Nav; }

const { width } = Dimensions.get('window');
const THUMB = (width - 6) / 3;

const STORAGE_KEY = 'cloudinary_images';

export interface CloudImage {
  url: string;
  public_id: string;
  category: string;
  createdAt: number;
  width?: number;
  height?: number;
}

export async function saveCloudImage(img: CloudImage) {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const list: CloudImage[] = existing ? JSON.parse(existing) : [];
    list.unshift(img);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {}
}

const CATEGORIES = [
  { key: 'all',      label: 'All',        icon: '🖼️' },
  { key: 'ai',       label: 'AI Images',  icon: '🤖' },
  { key: 'faceswap', label: 'Face Swap',  icon: '🤳' },
  { key: 'group',    label: 'Group',      icon: '👥' },
  { key: 'saved',    label: 'Saved',      icon: '💾' },
];

export default function CloudStorageScreen({ navigation }: Props) {
  const [images, setImages] = useState<CloudImage[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [preview, setPreview] = useState<CloudImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSize, setTotalSize] = useState('—');

  const loadImages = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list: CloudImage[] = raw ? JSON.parse(raw) : [];
      setImages(list);
      setTotalSize(`${list.length} images`);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadImages(); }, []);

  const filtered = activeCategory === 'all'
    ? images
    : images.filter(img => img.category === activeCategory);

  const deleteImage = async (img: CloudImage) => {
    Alert.alert('Delete பண்ணட்டுமா?', 'இந்த image local list-ல் இருந்து remove ஆகும்', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          const list: CloudImage[] = raw ? JSON.parse(raw) : [];
          const updated = list.filter(i => i.public_id !== img.public_id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setPreview(null);
          loadImages();
        },
      },
    ]);
  };

  const categoryCounts = CATEGORIES.map(c => ({
    ...c,
    count: c.key === 'all' ? images.length : images.filter(i => i.category === c.key).length,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerCloud}>☁️</Text>
          <Text style={styles.headerTitle}>My Cloud</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.headerGear}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadImages(); }} tintColor="#fff" />}
      >
        <Text style={styles.sectionLabel}>STORAGE</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
          {categoryCounts.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catCard, activeCategory === cat.key && styles.catCardActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, activeCategory === cat.key && styles.catLabelActive]}>{cat.label}</Text>
              {cat.count > 0 && (
                <View style={styles.catBadge}><Text style={styles.catBadgeText}>{cat.count}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.storageInfo}>
          <Text style={styles.storageTitle}>☁️ Cloudinary Storage</Text>
          <Text style={styles.storageCount}>{totalSize} saved</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#6C63FF" size="large" style={{ marginTop: 60 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☁️</Text>
            <Text style={styles.emptyText}>இங்க images இல்லை</Text>
            <Text style={styles.emptySubText}>Chat-ல் AI image generate பண்ணா இங்க save ஆகும்</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map(img => (
              <TouchableOpacity key={img.public_id} onPress={() => setPreview(img)}>
                <Image source={{ uri: img.url }} style={styles.thumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        {preview && (
          <View style={styles.modalBg}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPreview(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Image source={{ uri: preview.url }} style={styles.fullImg} resizeMode="contain" />
            <View style={styles.modalActions}>
              <View style={styles.modalInfo}>
                <Text style={styles.modalCat}>{preview.category.toUpperCase()}</Text>
                <Text style={styles.modalDate}>{new Date(preview.createdAt).toLocaleDateString('ta-IN')}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteImage(preview)}>
                <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#16213e',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerCloud: { fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerGear: { fontSize: 22 },
  scroll: { flex: 1 },
  sectionLabel: {
    color: '#aaa', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10,
  },
  catScroll: { marginBottom: 4 },
  catRow: { paddingHorizontal: 12, gap: 10, paddingBottom: 8 },
  catCard: {
    width: 80, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
    backgroundColor: '#16213e', borderRadius: 16, borderWidth: 1.5, borderColor: '#2a2a4a',
  },
  catCardActive: { borderColor: '#6C63FF', backgroundColor: '#2d2b55' },
  catIcon: { fontSize: 28, marginBottom: 6 },
  catLabel: { color: '#aaa', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  catLabelActive: { color: '#6C63FF' },
  catBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#6C63FF', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  catBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  storageInfo: {
    margin: 16, padding: 14, backgroundColor: '#16213e',
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4a',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  storageTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  storageCount: { color: '#6C63FF', fontSize: 13, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2 },
  thumb: { width: THUMB, height: THUMB, backgroundColor: '#2a2a4a' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  modalCloseText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  fullImg: { width, height: width, alignSelf: 'center' },
  modalActions: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
  },
  modalInfo: {},
  modalCat: { color: '#6C63FF', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  modalDate: { color: '#aaa', fontSize: 12, marginTop: 2 },
  deleteBtn: {
    backgroundColor: '#c62828', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
});
