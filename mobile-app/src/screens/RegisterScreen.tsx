import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import { User, Building, MapPin, Phone, Mail, Lock, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [campusName, setCampusName] = useState('Main Campus');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    if (!fullName.trim() || !schoolName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Registration failed. Please try again.');
      }

      // 2. Register School & Associate Admin via RPC
      const { error: rpcError } = await supabase.rpc('register_customer_and_school', {
        p_admin_name: fullName.trim(),
        p_school_name: schoolName.trim(),
        p_campus_name: campusName.trim() || 'Main Campus',
        p_city: city.trim() || 'Default City',
        p_phone: phone.trim()
      });

      if (rpcError) {
        console.warn('register_customer_and_school RPC warning:', rpcError);
      }

      Alert.alert(
        'Registration Successful!',
        'Your school account is created with 1-Year Free Cloud Service. You can now pair your AutoBell device.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Session will update AuthContext and transition to main app
            }
          }
        ]
      );
    } catch (err: unknown) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <ArrowLeft color="#94A3B8" size={20} />
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </TouchableOpacity>

              <View style={styles.badge}>
                <Sparkles color="#34D399" size={14} />
                <Text style={styles.badgeText}>1-Year Free Cloud Service</Text>
              </View>

              <Text style={styles.title}>Register School Account</Text>
              <Text style={styles.subtitle}>
                Unbox and activate your AutoBell in under 2 minutes
              </Text>
            </View>

            {/* Error Container */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.card}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Administrator Name *</Text>
                <View style={styles.inputContainer}>
                  <User color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Principal Sarah Khan"
                    placeholderTextColor="#64748B"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>School / Institution Name *</Text>
                <View style={styles.inputContainer}>
                  <Building color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Beacon High School"
                    placeholderTextColor="#64748B"
                    value={schoolName}
                    onChangeText={setSchoolName}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Campus</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Main Campus"
                      placeholderTextColor="#64748B"
                      value={campusName}
                      onChangeText={setCampusName}
                    />
                  </View>
                </View>

                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.label}>City</Text>
                  <View style={styles.inputContainer}>
                    <MapPin color="#64748B" size={16} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Lahore"
                      placeholderTextColor="#64748B"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Official Contact Phone</Text>
                <View style={styles.inputContainer}>
                  <Phone color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+92 300 1234567"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Admin Email Address *</Text>
                <View style={styles.inputContainer}>
                  <Mail color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="admin@school.edu.pk"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password (min 8 chars) *</Text>
                <View style={styles.inputContainer}>
                  <Lock color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.inputContainer}>
                  <Lock color="#64748B" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <CheckCircle color="#fff" size={18} style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Register School Account</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.signInLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>
                Already registered? <Text style={styles.signInHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 300,
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
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  signInLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signInText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  signInHighlight: {
    color: '#38BDF8',
    fontWeight: '600',
  },
});

