import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Bell, QrCode, Sparkles, CheckCircle, Volume2, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ClaimDeviceScreen({ navigation, route }: { navigation: any; route?: any }) {
  const initialSn = route?.params?.sn || '';
  const initialPin = route?.params?.pin || '';

  const [serialNumber, setSerialNumber] = useState(initialSn);
  const [claimPin, setClaimPin] = useState(initialPin);
  const [deviceName, setDeviceName] = useState('Main Campus Bell');
  const [qrInput, setQrInput] = useState('');
  const [showQrPaste, setShowQrPaste] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Celebration State
  const [activatedData, setActivatedData] = useState<{
    device_id?: string;
    serial_number?: string;
    subscription_end_date?: string;
  } | null>(null);

  const [testingChime, setTestingChime] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Helper: Parse QR code payload
  const handleParseQr = (text: string) => {
    setQrInput(text);
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const url = new URL(trimmed);
      const sn = url.searchParams.get('sn');
      const pin = url.searchParams.get('pin');
      if (sn) setSerialNumber(sn);
      if (pin) setClaimPin(pin);
      if (sn || pin) {
        setShowQrPaste(false);
        return;
      }
    } catch {
      // not a standard URL
    }

    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts[0]) setSerialNumber(parts[0].trim());
      if (parts[1]) setClaimPin(parts[1].trim());
      setShowQrPaste(false);
    }
  };

  const handleClaim = async () => {
    setError(null);

    if (!serialNumber.trim()) {
      setError('Please enter the device Serial Number.');
      return;
    }

    if (!claimPin.trim()) {
      setError('Please enter the 6-digit Claim PIN from the device sticker.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('claim_and_activate_device', {
        p_serial_number: serialNumber.trim(),
        p_claim_pin: claimPin.trim(),
        p_device_name: deviceName.trim() || 'Main Campus Bell'
      });

      if (rpcError) throw rpcError;

      setActivatedData(data);
    } catch (err: unknown) {
      console.error('Claim device error:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim device.');
    } finally {
      setLoading(false);
    }
  };

  // Immediate Sound Test Trigger
  const handleRingTest = async () => {
    if (!activatedData?.device_id) return;
    setTestingChime(true);
    setTestSent(false);

    try {
      const { error: cmdError } = await supabase.from('command_queue').insert({
        device_id: activatedData.device_id,
        command: 'RING',
        payload: {
          duration_seconds: 3,
          trigger: 'mobile_retail_onboarding_test',
          requested_at: new Date().toISOString()
        }
      });

      if (cmdError) throw cmdError;
      setTestSent(true);
    } catch (err) {
      console.error('Test chime error:', err);
      Alert.alert('Chime Test', 'Could not dispatch test command. Please check your network connection.');
    } finally {
      setTestingChime(false);
    }
  };

  // Celebration View
  if (activatedData) {
    const expiryDate = activatedData.subscription_end_date
      ? new Date(activatedData.subscription_end_date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '1 Year';

    return (
      <LinearGradient colors={['#0F172A', '#064E3B', '#0F172A']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.celebrationCard}>
              <View style={styles.celebrationIconWrap}>
                <CheckCircle color="#34D399" size={56} />
              </View>

              <View style={styles.badgeSuccess}>
                <Sparkles color="#34D399" size={14} />
                <Text style={styles.badgeSuccessText}>AutoBell Active & Ready</Text>
              </View>

              <Text style={styles.celebrationTitle}>Device Activated!</Text>
              <Text style={styles.celebrationSubtitle}>
                Unit <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#fff' }}>{activatedData.serial_number || serialNumber}</Text> is paired with your school.
              </Text>

              {/* Free 1-Year Cloud Service info */}
              <View style={styles.warrantyBox}>
                <ShieldCheck color="#34D399" size={20} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warrantyTitle}>12 Months Free Cloud Service Active</Text>
                  <Text style={styles.warrantySubtitle}>
                    Complimentary subscription valid until: <Text style={{ color: '#fff', fontWeight: 'bold' }}>{expiryDate}</Text>
                  </Text>
                </View>
              </View>

              {/* Audio Verification Test */}
              <View style={styles.soundTestBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.soundTestTitle}>Verify Speaker Audio</Text>
                  <Text style={styles.soundTestSubtitle}>
                    Trigger a 3-second chime test on the hardware bell.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.soundTestButton}
                  onPress={handleRingTest}
                  disabled={testingChime}
                >
                  {testingChime ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Volume2 color="#fff" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.soundTestButtonText}>Ring Test</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {testSent && (
                <Text style={styles.testSuccessNotice}>
                  ✓ Chime command sent! AutoBell will ring shortly.
                </Text>
              )}

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.doneButtonText}>Go to School Dashboard</Text>
                <ArrowRight color="#fff" size={18} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.bellIconWrap}>
              <Bell color="#38BDF8" size={32} />
            </View>
            <Text style={styles.title}>Pair & Activate AutoBell</Text>
            <Text style={styles.subtitle}>
              Enter the Serial Number & PIN from the sticker on your controller or retail box.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Quick QR Payload Paste Drawer */}
          <TouchableOpacity
            style={styles.qrToggle}
            onPress={() => setShowQrPaste(!showQrPaste)}
          >
            <QrCode color="#38BDF8" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.qrToggleText}>
              {showQrPaste ? 'Hide QR Link Input' : 'Scan or Paste QR Code Payload'}
            </Text>
          </TouchableOpacity>

          {showQrPaste && (
            <View style={styles.qrPasteCard}>
              <Text style={styles.label}>Paste Scanned QR String or Deep Link</Text>
              <TextInput
                style={styles.input}
                placeholder="https://app.autobell.pk/setup?sn=...&pin=..."
                placeholderTextColor="#64748B"
                value={qrInput}
                onChangeText={handleParseQr}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Device Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Main Hall Bell"
                  placeholderTextColor="#64748B"
                  value={deviceName}
                  onChangeText={setDeviceName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Serial Number (from sticker label) *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.monoText]}
                  placeholder="AB-S3-2026-0001"
                  placeholderTextColor="#64748B"
                  autoCapitalize="characters"
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>6-Digit Claim PIN *</Text>
              <View style={[styles.inputContainer, { justifyContent: 'center' }]}>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  placeholder="648291"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  maxLength={7}
                  value={claimPin}
                  onChangeText={setClaimPin}
                />
              </View>
              <Text style={styles.pinHint}>
                Printed on the label on the back of the controller and outside the box.
              </Text>
            </View>

            <View style={styles.perkCard}>
              <Sparkles color="#34D399" size={18} style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.perkTitle}>Instant 1-Year Free Activation</Text>
                <Text style={styles.perkDescription}>
                  Validating your Claim PIN instantly activates 12 months of cloud sync, schedule automation, and remote triggers.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleClaim}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Claim & Activate Device</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bellIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 290,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  qrToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  qrToggleText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  qrPasteCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    color: '#fff',
    fontSize: 14,
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  pinInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
  },
  pinHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: 14,
    marginBottom: 20,
  },
  perkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
    marginBottom: 2,
  },
  perkDescription: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  celebrationCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  celebrationIconWrap: {
    marginBottom: 16,
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeSuccessText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  celebrationSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  warrantyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  warrantyTitle: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  warrantySubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  soundTestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  soundTestTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  soundTestSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    maxWidth: 180,
  },
  soundTestButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  soundTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  testSuccessNotice: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: '#2563EB',
    width: '100%',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

