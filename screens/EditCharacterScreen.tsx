import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
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

const DEFAULT_ATTIRE = `high neckline (deep cut இல்லாமல்), மார்பு பகுதி முழுவதும் மறைக்கப்பட்டிருக்க வேண்டும், transparency (ஒளிரவு) இல்லாத துணி, sleeves இருக்க வேண்டும் (half / full sleeve), தோள்கள் முழுவதும் மறைக்கப்பட்டிருக்க வேண்டும், strap தெரியக் கூடாது, midriff தெரியக் கூடாது, top முழுவதும் waist வரை cover ஆக வேண்டும், tight அல்லது revealing cut இல்லாமல், knee க்கு கீழே வரும் skirt / அல்லது full pants, தொடைகள் முழுவதும் மறைக்கப்பட்டிருக்க வேண்டும், slit இல்லாமல், முழு கால்களும் cover ஆக வேண்டும், skin exposure இல்லாமல், சாதாரண footwear (சண்டல் / ஷூ), clean look, cleavage தெரியாதது, deep neckline இல்லாமல், low cut top இல்லாமல், transparent துணி இல்லாமல், innerwear வெளியில் தெரியாதது, strap visible ஆகாதது, sleeveless இல்லாமல், off-shoulder இல்லாமல், midriff (வயிறு) தெரியாதது, tight அல்லது body-revealing dress இல்லாமல், short skirt இல்லாமல், high slit இல்லாமல், thighs தெரியாதது, legs exposure இல்லாமல், see-through fabric இல்லாமல், unrealistic body proportions இல்லாமல்`;

const DEFAULT_POSE = `சீரிய மற்றும் மரியாதையான pose, dignified respectful pose, கைகள் சாதாரணமாக இருக்கும் (அசிங்கமான சைசைகள் இல்லாமல்), hands in natural position, அமைதியான முகபாவனை, calm facial expression, மென்மையான சிரிப்பு, gentle soft smile, இயல்பான makeup, natural makeup, ஒழுங்காக அமைக்கப்பட்ட முடி, neatly arranged hair (loose / tied), overly glamorous அல்லது provocative pose இல்லாமல்`;

const DEFAULT_SETTING = `lean indoor background, warm ambience`;

const DEFAULT_LIGHTING = `சிமாட்டிக் காட்சி, cinematic soft lighting`;

const DEFAULT_ART_STYLE = `லாத classy மற்றும் அழகான தோற்றம்`;

const DEFAULT_MODEST_NEG = `nsfw, nude, semi-nude, மார்பு வெளிப்பாடு, cleavage, deep cleavage, breasts visible, nipple, areola, underboob, sideboob, transparent dress, see-through, lingerie, bra தெரியும், revealing dress, மிகவும் tight உடை, இடுப்பு வெளிப்பாடு, நாபி தெரிதல், தொடைகள் வெளிப்பாடு, high slit, groin area தெரிதல், buttocks, கவர்ச்சியான pose, erotic expression, tongue out, அசிங்கமான கை சைசைகள், seductive look, low neckline, wet clothes, body highlight, மார்பு பகுதி (bust / cleavage visible ஆகாதது), நிப்பிள் அல்லது அதற்கான outline, இடுப்பு கீழ் private areas (pelvic / groin area), தொடைகள் மிக அதிகமாக வெளிப்படுவது, பின்புறம் (buttocks), உடை transparency மூலம் தெரியும் skin details`;

const DEFAULT_BODY_NEG = `deformed body, disfigured, malformed limbs, fused fingers, extra fingers, missing fingers, twisted hands, unnatural proportions, warped anatomy, stretched skin, elongated limbs, blurry limbs, extra limbs, bad arms, disconnected limbs`;

const DEFAULT_QUALITY_NEG = `low resolution, blur, out of focus, grainy, noisy, double image, low quality, pixelated, aliasing, bad composition, overexposed, underexposed`;

export default function EditCharacterScreen({ navigation, route }: Props) {
  const { persona } = route.params;

  const [name, setName] = useState(persona.name);
  const [avatarLetter, setAvatarLetter] = useState(persona.avatarLetter ?? persona.emoji);
  const [greeting, setGreeting] = useState(persona.greeting ?? '');
  const [systemPrompt, setSystemPrompt] = useState(persona.prompt);
  const [faceDesc, setFaceDesc] = useState(persona.faceDesc ?? '');
  const [bodyDesc, setBodyDesc] = useState(persona.bodyDesc ?? '');
  const [attireDesc, setAttireDesc] = useState(persona.attireDesc ?? DEFAULT_ATTIRE);
  const [poseDesc, setPoseDesc] = useState(persona.poseDesc ?? DEFAULT_POSE);
  const [settingDesc, setSettingDesc] = useState(persona.settingDesc ?? DEFAULT_SETTING);
  const [lightingDesc, setLightingDesc] = useState(persona.lightingDesc ?? DEFAULT_LIGHTING);
  const [artStyleDesc, setArtStyleDesc] = useState(persona.artStyleDesc ?? DEFAULT_ART_STYLE);
  const [modestNeg, setModestNeg] = useState(persona.modestNegative ?? DEFAULT_MODEST_NEG);
  const [bodyHandsNeg, setBodyHandsNeg] = useState(persona.bodyHandsNegative ?? DEFAULT_BODY_NEG);
  const [qualityNeg, setQualityNeg] = useState(persona.qualityNegative ?? DEFAULT_QUALITY_NEG);
  const [avatarPhotoUri, setAvatarPhotoUri] = useState<string | undefined>(persona.avatarPhotoUri);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name, avatarLetter, greeting, prompt: systemPrompt,
        faceDesc, bodyDesc, attireDesc, poseDesc, settingDesc,
        lightingDesc, artStyleDesc, modestNegative: modestNeg,
        bodyHandsNegative: bodyHandsNeg, qualityNegative: qualityNeg,
        avatarPhotoUri,
      };
      await AsyncStorage.setItem(`persona_edit_${persona.id}`, JSON.stringify(data));
      Alert.alert('Saved ✅', `${name} character update ஆச்சு!`);
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
  }, [saving, name, avatarLetter, greeting, systemPrompt, faceDesc, bodyDesc,
      attireDesc, poseDesc, settingDesc, lightingDesc, artStyleDesc,
      modestNeg, bodyHandsNeg, qualityNeg, avatarPhotoUri]);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission', 'Gallery permission வேணும்'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarPhotoUri(result.assets[0].uri);
    }
  };

  const Field = ({ label, hint, value, onChange, minH = 60 }: {
    label: string; hint?: string; value: string;
    onChange: (v: string) => void; minH?: number;
  }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { minHeight: minH }]}
        value={value}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#bbb"
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
            {avatarPhotoUri ? (
              <Image source={{ uri: avatarPhotoUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: persona.avatarColor }]}>
                <Text style={styles.avatarEmoji}>{avatarLetter || persona.emoji}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickAvatar}>
            <Text style={styles.uploadBtnText}>⬆ Upload photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── Basic Info ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Character பேரு..."
            placeholderTextColor="#bbb"
          />

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>AVATAR LETTER (OPTIONAL, USED WHEN NO PHOTO)</Text>
          <TextInput
            style={styles.nameInput}
            value={avatarLetter}
            onChangeText={setAvatarLetter}
            placeholder="ஒரு எழுத்து (e.g. க, ப, த)"
            placeholderTextColor="#bbb"
            maxLength={2}
          />

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>GREETING (FIRST MESSAGE)</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 80 }]}
            value={greeting}
            onChangeText={setGreeting}
            multiline
            textAlignVertical="top"
            placeholder="Character-ஓட first message இங்க type பண்ணுங்க..."
            placeholderTextColor="#bbb"
          />
        </View>

        {/* ── System Prompt ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SYSTEM PROMPT (CHARACTER BEHAVIOR)</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 200 }]}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            textAlignVertical="top"
            placeholder="Character behavior prompt..."
            placeholderTextColor="#bbb"
          />
        </View>

        {/* ── Image Generation Template ── */}
        <View style={styles.card}>
          <View style={styles.imgHeader}>
            <Text style={styles.imgHeaderIcon}>🖼</Text>
            <Text style={styles.imgHeaderTitle}>Image Generation Template</Text>
          </View>
          <Text style={styles.imgHeaderHint}>
            Avatar upload பண்ணி "Character update" press பண்ணினால் முக அமைப்பு auto-fill ஆகும்
          </Text>

          <Text style={styles.fieldLabel}>A. முக அமைப்பு (FACE) — AVATAR-ல் இருந்து AUTO-UPDATE ஆகும்</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 80 }]}
            value={faceDesc}
            onChangeText={setFaceDesc}
            multiline
            textAlignVertical="top"
            placeholder="வயது, முகம், கண்கள், தோல், முடி..."
            placeholderTextColor="#bbb"
          />
          <Text style={styles.fieldHint}>வயது, முகம், கண்கள், தோல், முடி — avatar upload பண்ணி 'Character update' press பண்ணினால் auto-fill ஆகும்</Text>

          <View style={styles.divider} />

          <Field
            label="B. உடல் அமைப்பு (BODY)"
            hint="உயரம், உடல் வடிவம், figure"
            value={bodyDesc}
            onChange={setBodyDesc}
            minH={80}
          />

          <View style={styles.divider} />

          <Field
            label="C. உடை / தோற்றம் (ATTIRE)"
            hint="என்ன உடை அணிந்திருக்கிறார்"
            value={attireDesc}
            onChange={setAttireDesc}
            minH={120}
          />

          <View style={styles.divider} />

          <Field
            label="D. தோரணை / செயல் (POSE & ACTION)"
            hint="எப்படி நிற்கிறார், என்ன செய்கிறார், என்ன expression"
            value={poseDesc}
            onChange={setPoseDesc}
            minH={100}
          />

          <View style={styles.divider} />

          <Field
            label="E. இடம் / சூழல் (SETTING)"
            hint="எங்கே, என்ன background"
            value={settingDesc}
            onChange={setSettingDesc}
            minH={50}
          />

          <View style={styles.divider} />

          <Field
            label="F. ஒளி / வண்ணம் (LIGHTING)"
            hint="lighting style மற்றும் color mood"
            value={lightingDesc}
            onChange={setLightingDesc}
            minH={50}
          />

          <View style={styles.divider} />

          <Field
            label="G. பாணி (ART STYLE)"
            hint="photorealistic / anime / oil painting / cinematic"
            value={artStyleDesc}
            onChange={setArtStyleDesc}
            minH={50}
          />

          <View style={styles.divider} />

          <Field
            label="H. MODEST NEGATIVE — வெளிப்படாத உடை"
            hint="இது display மட்டுமே — image generation-ல affect ஆகாது. API server-ல separate-ஆ handle ஆகும்."
            value={modestNeg}
            onChange={setModestNeg}
            minH={120}
          />

          <View style={styles.divider} />

          <Field
            label="I. BODY & HANDS NEGATIVE — உடல் குறைபாடுகள்"
            hint="இது display மட்டுமே — image generation-ல affect ஆகாது"
            value={bodyHandsNeg}
            onChange={setBodyHandsNeg}
            minH={80}
          />

          <View style={styles.divider} />

          <Field
            label="J. QUALITY NEGATIVE — படத் தரம்"
            hint="இது display மட்டுமே — image generation-ல affect ஆகாது"
            value={qualityNeg}
            onChange={setQualityNeg}
            minH={60}
          />
        </View>

        <Text style={styles.footerNote}>
          This is a built-in character. Your edits are saved locally and can be reset by clearing edits.
        </Text>

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
  content: { padding: 12, paddingBottom: 50 },

  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarEmoji: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: '#333', borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  cameraIcon: { fontSize: 14 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#075E54',
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, gap: 6,
  },
  uploadBtnText: { color: '#075E54', fontSize: 14, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#888',
    letterSpacing: 0.8, marginBottom: 8,
  },
  nameInput: {
    backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1,
    borderColor: '#e0e0e0', padding: 10, fontSize: 15, color: '#111',
  },
  imgHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  imgHeaderIcon: { fontSize: 18, marginRight: 6 },
  imgHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  imgHeaderHint: { fontSize: 12, color: '#888', marginBottom: 14, lineHeight: 18 },
  fieldWrap: { marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 4 },
  fieldInput: {
    backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1,
    borderColor: '#e0e0e0', padding: 10, fontSize: 14, color: '#222', lineHeight: 20,
  },
  fieldHint: { fontSize: 11, color: '#aaa', marginTop: 4, marginBottom: 4, lineHeight: 16 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
  footerNote: {
    fontSize: 12, color: '#888', textAlign: 'center',
    paddingHorizontal: 20, marginBottom: 16, lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: '#075E54', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
