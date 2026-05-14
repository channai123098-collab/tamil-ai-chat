import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Alert,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HF_KEY_STORAGE = 'hf_api_key';

export default function FaceSwapScreen() {
  const [hfKey, setHfKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [targetUri, setTargetUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(HF_KEY_STORAGE).then(k => {
      if (k) { setHfKey(k); setKeySaved(true); }
    });
  }, []);

  const saveKey = async () => {
    if (!hfKey.trim()) return;
    await AsyncStorage.setItem(HF_KEY_STORAGE, hfKey.trim());
    setKeySaved(true);
    Alert.alert('✅ Saved', 'HuggingFace Key சேமிக்கப்பட்டது!');
  };

  const pickImage = async (type: 'source' | 'target') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission வேணும்', 'Gallery access allow பண்ணுங்க'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === 'source') setSourceUri(result.assets[0].uri);
      else setTargetUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const doFaceSwap = async () => {
    if (!hfKey.trim()) { Alert.alert('Key வேணும்', 'HuggingFace API key save பண்ணுங்க'); return; }
    if (!sourceUri || !targetUri) { Alert.alert('Photo வேணும்', 'Source + Target photo தேர்வு பண்ணுங்க'); return; }
    setLoading(true);
    setResultUri(null);
    try {
      const srcB64 = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
      const tgtB64 = await FileSystem.readAsStringAsync(targetUri, { encoding: FileSystem.EncodingType.Base64 });

      const response = await fetch(
        'https://api-inference.huggingface.co/models/minchul/cvlface_adaface_ir101_webface4m',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              source_image: srcB64,
              target_image: tgtB64,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText.slice(0, 200));
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setResultUri(dataUrl);
        setLoading(false);
      };
      reader.onerror = () => {
        setLoading(false);
        Alert.alert('பிழை', 'Result படிக்க முடியவில்லை');
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Face Swap பிழை', err?.message || 'மீண்டும் முயல்க. Model load ஆக நேரம் ஆகலாம்.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, !keySaved && styles.cardHighlight]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🤗</Text>
            <Text style={styles.cardTitle}>HuggingFace API Key</Text>
            {!keySaved && <Text style={styles.keyRequired}>KEY வேணும்</Text>}
            {keySaved && <Text style={styles.keySavedBadge}>✓ Saved</Text>}
          </View>
          <TextInput
            style={styles.keyInput}
            value={hfKey}
            onChangeText={v => { setHfKey(v); setKeySaved(false); }}
            placeholder="hf_xxxxxxxxxxxxxxxxxxxx  (huggingface.co → free)"
            placeholderTextColor="#aaa"
            secureTextEntry={!keyVisible}
            autoCapitalize="none"
          />
          <View style={styles.keyBtns}>
            <TouchableOpacity style={styles.showBtn} onPress={() => setKeyVisible(!keyVisible)}>
              <Text style={styles.showBtnTxt}>{keyVisible ? '🙈 Hide' : '👁️ Show'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveKey}>
              <Text style={styles.saveBtnTxt}>✓ Save Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.instrTxt}>
            Source-ல் உங்க face photo, Target-ல் AI girl-ன் image — Swap பண்ணா உங்க face அந்த image-ல் வரும்!
          </Text>

          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>SOURCE (உங்க Face)</Text>
              <TouchableOpacity style={styles.pickerBox} onPress={() => pickImage('source')}>
                {sourceUri
                  ? <Image source={{ uri: sourceUri }} style={styles.pickedImg} />
                  : <><Text style={styles.pickerPlaceholderIcon}>👤</Text><Text style={styles.pickerPlaceholderTxt}>Tap to pick</Text></>
                }
                <View style={styles.pickerBadge}>
                  <Text style={styles.pickerBadgeIcon}>📷</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>TARGET (AI Image)</Text>
              <TouchableOpacity style={styles.pickerBox} onPress={() => pickImage('target')}>
                {targetUri
                  ? <Image source={{ uri: targetUri }} style={styles.pickedImg} />
                  : <><Text style={styles.pickerPlaceholderIcon}>🖼️</Text><Text style={styles.pickerPlaceholderTxt}>Tap to pick</Text></>
                }
                <View style={[styles.pickerBadge, styles.pickerBadgePurple]}>
                  <Text style={styles.pickerBadgeIcon}>🎨</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.swapBtn, (!sourceUri || !targetUri || loading) && styles.swapBtnDisabled]}
            onPress={doFaceSwap}
            disabled={!sourceUri || !targetUri || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.swapBtnTxt}>Face Swap பண்ணு! 🤳</Text>
            }
          </TouchableOpacity>
        </View>

        {resultUri && (
          <View style={styles.card}>
            <Text style={styles.resultTitle}>✅ Result</Text>
            <Image source={{ uri: resultUri }} style={styles.resultImg} resizeMode="contain" />
          </View>
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipItem}>• Source photo-ல் face clearly தெரியணும் (selfie நல்லது)</Text>
          <Text style={styles.tipItem}>• Target image-ல் ஒரே ஒரு face இருந்தா better</Text>
          <Text style={styles.tipItem}>• HuggingFace free — peak hours-ல் slow ஆகலாம்</Text>
          <Text style={styles.tipItem}>• Key: huggingface.co → Profile → Access Tokens → New token (read)</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f0eb' },
  scroll: { padding: 14, gap: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, elevation: 2,
  },
  cardHighlight: { borderWidth: 1.5, borderColor: '#E53935' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardIcon: { fontSize: 22 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#333' },
  keyRequired: {
    backgroundColor: '#E53935', color: '#fff', fontSize: 11,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontWeight: 'bold',
  },
  keySavedBadge: {
    backgroundColor: '#25D366', color: '#fff', fontSize: 11,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontWeight: 'bold',
  },
  keyInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 13,
    color: '#333', backgroundColor: '#fafafa', marginBottom: 10,
  },
  keyBtns: { flexDirection: 'row', gap: 10 },
  showBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#ddd',
  },
  showBtnTxt: { color: '#555', fontSize: 13 },
  saveBtn: { flex: 1, backgroundColor: '#25D366', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  instrTxt: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 16 },
  pickerRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickerCol: { flex: 1, alignItems: 'center' },
  pickerLabel: { fontSize: 11, fontWeight: 'bold', color: '#888', marginBottom: 8, textAlign: 'center' },
  pickerBox: {
    width: '100%', aspectRatio: 1, borderRadius: 12,
    backgroundColor: '#f5f0eb', justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#e0d9d0',
    overflow: 'hidden',
  },
  pickedImg: { width: '100%', height: '100%' },
  pickerPlaceholderIcon: { fontSize: 36, marginBottom: 6 },
  pickerPlaceholderTxt: { fontSize: 12, color: '#888' },
  pickerBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: '#25D366', borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  pickerBadgePurple: { backgroundColor: '#7B1FA2' },
  pickerBadgeIcon: { fontSize: 14 },
  swapBtn: {
    backgroundColor: '#25D366', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  swapBtnDisabled: { backgroundColor: '#a8d5b5' },
  swapBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultTitle: { fontSize: 16, fontWeight: 'bold', color: '#075E54', marginBottom: 10 },
  resultImg: { width: '100%', height: 300, borderRadius: 12 },
  tipsCard: { backgroundColor: '#fffde7', borderRadius: 16, padding: 16 },
  tipsTitle: { fontSize: 15, fontWeight: 'bold', color: '#F57F17', marginBottom: 10 },
  tipItem: { fontSize: 13, color: '#555', lineHeight: 22 },
});
