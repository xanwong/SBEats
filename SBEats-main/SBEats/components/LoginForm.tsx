/**
 * Form component for user login/authentication.
 */
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseconfig';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

export default function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = AppColor[colorScheme ?? 'light'];
  const textColor = theme.text;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'User Not Found',
          'No account exists with this email. Please sign up.',
        );
      } else if (error.code === 'auth/invalid-credential') {
        Alert.alert('Wrong Password', 'The password you entered is incorrect.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        Alert.alert(
          'Login Error',
          error.message || 'Failed to log in. Please try again.',
        );
      }
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome Back
      </ThemedText>
      <ThemedText style={styles.subtitle}>Sign in to your account</ThemedText>

      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Email"
        placeholderTextColor={theme.mutedText}
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Password"
        placeholderTextColor={theme.mutedText}
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.tint }, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSwitchToSignUp}>
        <ThemedText style={[styles.switchText, { color: theme.mutedText }]}>
          Don't have an account?{' '}
          <ThemedText style={[styles.switchLink, { color: theme.tint }]}>Sign Up</ThemedText>
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    marginBottom: Spacing.xxxl,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: Typography.size.md,
    fontFamily: Typography.family,
  },
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  switchText: {
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  switchLink: {
    fontWeight: Typography.weight.bold,
  },
});
