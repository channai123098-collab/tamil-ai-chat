import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { Persona } from './HomeScreen';

type Nav = StackNavigationProp<RootStackParamList, 'EditCharacter'>;
type Route = RouteProp<RootStackParamList, 'EditCharacter'>;
interface Props { navigation: Nav; route: Route; }

export default function EditCharacterScreen({ navigation, route }: Props) {
  const { persona } = route.params;

  const [systemPrompt, setSystemPrompt] = useState(persona.prompt);
  const [faceDesc, setFaceDesc] = useState(persona.faceDesc ?? '');
  const [bodyDesc, setBodyDesc] = useState(persona.bodyDesc ?? '');
  const [attireDesc, setAttireDesc] = useState(persona.attireDesc ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { prompt: systemPrompt, faceDesc, bodyDesc, attireDesc };
      await AsyncStorage.setItem(`persona_edit_${persona.id}`, JSON.stringify(data));
      Alert.alert('Saved ✅', `${persona.name} character update ஆச்சு!`);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Save பண்ண முடியல, retry பண்ணுங்க');
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginRight: 16 }}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Save</Text>
          }
        </TouchableOpacity>
      ),
    });
  }, [saving, systemPrompt, faceDesc, bodyDesc, attireDesc]);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Gallery permission வேணும்');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      Alert.alert(
        'Avatar பார்த்தோம் 📸',
        'இந்த feature-ல் avatar auto-fill coming soon! இப்போ manually face description type பண்ணுங்க.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SYSTEM PROMPT (CHARACTER BEHAVIOR)</Text>
          <TextInput
            style={styles.bigInput}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            textAlignVertical="top"
            placeholder="Character behavior prompt இங்க type பண்ணுங்க..."
            placeholderTextColor="#bbb"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.imgTitleRow}>
            <Text style={styles.imgIcon}>🖼</Text>
            <Text style={styles.imgTitle}>Image Generation Template</Text>
          </View>
          <Text style={styles.imgHint}>
            Avatar upload பண்ணி "Character update" press பண்ணினால் முக அமைப்பு auto-fill ஆகும்
          </Text>

          <Text style={styles.fieldLabel}>A. முக அமைப்பு (FACE) — AVATAR-ல் இருந்து AUTO-UPDATE ஆகும்</Text>
          <TextInput
            style={styles.fieldInput}
            value={faceDesc}
            onChangeText={setFaceDesc}
            multiline
            textAlignVertical="top"
            placeholder="e.g. beautiful Tamil woman, 28 years old, warm eyes..."
            placeholderTextColor="#bbb"
          />
          <Text style={styles.fieldHint}>
            வயது, முகம், கண்கள், தோல், முடி — avatar upload பண்ணி 'Character update' press பண்ணினால் auto-fill ஆகும்
          </Text>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickAvatar}>
            <Text style={styles.uploadBtnText}>🖼  Avatar upload பண்ணுங்க</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>B. உடல் அமைப்பு (BODY)</Text>
          <TextInput
            style={styles.fieldInput}
            value={bodyDesc}
            onChangeText={setBodyDesc}
            multiline
            textAlignVertical="top"
            placeholder="e.g. slim figure, natural proportioned, realistic body shape..."
            placeholderTextColor="#bbb"
          />
          <Text style={styles.fieldHint}>உயரம், உடல் வடிவம், figure</Text>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>C. உடை / தோற்றம் (ATTIRE)</Text>
          <TextInput
            style={styles.fieldInput}
            value={attireDesc}
            onChangeText={setAttireDesc}
            multiline
            textAlignVertical="top"
            placeholder="e.g. traditional saree, high neckline, modest dress..."
            placeholderTextColor="#bbb"
          />
          <Text style={styles.fieldHint}>ஆடை வடிவமைப்பு, நிறம், style</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Character</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  scroll: { flex: 1 },
  content: { padding: 12, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  bigInput: {
    fontSize: 14,
    color: '#222',
    lineHeight: 22,
    minHeight: 220,
    padding: 0,
  },

  imgTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  imgIcon: { fontSize: 18, marginRight: 6 },
  imgTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  imgHint: { fontSize: 12, color: '#888', marginBottom: 14, lineHeight: 18 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
    marginTop: 4,
  },
  fieldInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    fontSize: 14,
    color: '#222',
    minHeight: 80,
    lineHeight: 20,
  },
  fieldHint: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 16,
  },

  uploadBtn: {
    borderWidth: 1.5,
    borderColor: '#075E54',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  uploadBtnText: { color: '#075E54', fontSize: 14, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },

  saveBtn: {
    backgroundColor: '#075E54',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
