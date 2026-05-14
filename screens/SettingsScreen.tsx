import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'https://tamil-chat-api.onrender.com';
const APP_VERSION = '1.2.0';
const LATEST_APK_URL = 'https://expo.dev/artifacts/eas/m6q6Vd9FkV5kVwHxZwEUFw.apk';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SettingsScreen() {
  const [renderStatus, setRenderStatus] = useState<Status>('idle');
  const [renderMsg, setRenderMsg] = useState('');
  const [updateStatus, setUpdateStatus] = useState<Status>('idle');
  const [updateMsg, setUpdateMsg] = useState('');

  const refreshRender = async () => {
    setRenderStatus('loading');
    setRenderMsg('Render server-ஐ எழுப்புகிறோம்...');
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/api/healthz`);
      const ms = Date.now() - start;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setRenderStatus('success');
        setRenderMsg(`✅ Server ready! (${ms}ms) — ${data.status || 'ok'}`);
      } else {
        setRenderStatus('error');
        setRenderMsg(`⚠️ HTTP ${res.status} — மீண்டும் முயல்க`);
      }
    } catch (e) {
      const ms = Date.now() - start;
      setRenderStatus('error');
      setRenderMsg(`❌ ${ms > 25000 ? 'Timeout — server தூங்குது, மீண்டும் tap பண்ணு' : e?.message || 'Connection error'}`);
    }
  };

  const checkUpdate = async () => {
    setUpdateStatus('loading');
    setUpdateMsg('Latest version check பண்றோம்...');
    try {
      const res = await fetch(`${API_BASE}/api/healthz`);
      setUpdateStatus('success');
      setUpdateMsg(res.ok
        ? `ℹ️ Current: v${APP_VERSION} — Latest APK download-ல் available`
        : `ℹ️ Current: v${APP_VERSION} — Download link கீழே இருக்கு`);
    } catch {
      setUpdateStatus('success');
      setUpdateMsg(`ℹ️ Current: v${APP_VERSION} — Download link கீழே இருக்கு`);
    }
  };

  const statusColor = (s: Status) => s === 'success' ? '#1B5E20' : s === 'error' ? '#B71C1C' : '#555';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🖥️</Text>
            <View style={styles.cardTitles}>
              <Text style={styles.cardTitle}>Render API Server</Text>
              <Text style={styles.cardSub}>tamil-chat-api.onrender.com</Text>
            </View>
          </View>
          <Text style={styles.infoText}>Free server-ல் 15 நிமிடம் idle-ஆ இருந்தா தூங்கிடும். Tap பண்ணி எழுப்புங்க!</Text>
          <TouchableOpacity style={[styles.actionBtn, styles.renderBtn, renderStatus === 'loading' && styles.btnDisabled]} onPress={refreshRender} disabled={renderStatus === 'loading'}>
            {renderStatus === 'loading' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnTxt}>🔄  Render Server Refresh</Text>}
          </TouchableOpacity>
          {renderMsg ? <Text style={[styles.statusMsg, { color: statusColor(renderStatus) }]}>{renderMsg}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📲</Text>
            <View style={styles.cardTitles}>
              <Text style={styles.cardTitle}>App Update</Text>
              <Text style={styles.cardSub}>தற்போதைய version: v{APP_VERSION}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.actionBtn, styles.updateBtn, updateStatus === 'loading' && styles.btnDisabled]} onPress={checkUpdate} disabled={updateStatus === 'loading'}>
            {updateStatus === 'loading' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnTxt}>🔍  Check for Update</Text>}
          </TouchableOpacity>
          {updateMsg ? <Text style={[styles.statusMsg, { color: statusColor(updateStatus) }]}>{updateMsg}</Text> : null}
          <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(LATEST_APK_URL)}>
            <Text style={styles.downloadBtnTxt}>⬇️  Latest APK Download</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>ℹ️</Text>
            <Text style={styles.cardTitle}>App Info</Text>
          </View>
          {[
            ['App Version', `v${APP_VERSION}`],
            ['AI Model', 'Gemini 2.5 Flash'],
            ['Provider', 'Google Gemini'],
            ['API Server', 'Render.com'],
            ['Characters', '10 Tamil AI'],
          ].map(([label, val]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoVal}>{val}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipItem}>• முதல் message slow-ஆ வந்தா — Render Refresh tap பண்ணுங்க</Text>
          <Text style={styles.tipItem}>• Face Swap-க்கு HuggingFace free key வேணும்</Text>
          <Text style={styles.tipItem}>• Group Chat-ல் 2+ characters select பண்ணி பேசலாம்</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  scroll: { padding: 14, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { fontSize: 26 },
  cardTitles: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  cardSub: { fontSize: 11, color: '#888', marginTop: 1 },
  infoText: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 12 },
  actionBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  renderBtn: { backgroundColor: '#075E54' },
  updateBtn: { backgroundColor: '#1565C0' },
  btnDisabled: { opacity: 0.6 },
  actionBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusMsg: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  downloadBtn: { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 4 },
  downloadBtnTxt: { color: '#1565C0', fontWeight: '600', fontSize: 13 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoLabel: { fontSize: 13, color: '#666' },
  infoVal: { fontSize: 13, fontWeight: '600', color: '#111' },
  tipsCard: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16 },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  tipItem: { fontSize: 12, color: '#444', lineHeight: 22 },
});
