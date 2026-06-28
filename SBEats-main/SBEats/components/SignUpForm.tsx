/**
 * Form component for registering a new user account.
 */
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseconfig';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';

import { doc, setDoc } from 'firebase/firestore';
import { UserProfile } from '@/types/User';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export async function createUserProfile(
  uid: string,
  email: string,
  username: string
): Promise<void> {
  try {
    const userProfile: UserProfile = {
      uid: uid,
      email: email,
      username: username,
      avatarUrl: '',
      placesVisited: 0,
      followingCount: 0,
      followersCount: 0,
      savedByCategory: {}, 
      createdAt: new Date(),
      updatedAt: new Date(), 
    };

    // Create document in 'users' collection with user's UID as document ID
    await setDoc(doc(db, 'users', uid), userProfile);
    
    console.log('User profile created successfully!');
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = AppColor[colorScheme ?? 'light'];
  const textColor = theme.text;

  const handleSignUp = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      // Create user and userProfile
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await createUserProfile(user.uid, email, username);
      console.log('Signup successful!');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Email Already Exists',
          'This email is already registered. Please log in instead.',
        );
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert(
          'Weak Password',
          'Password should be at least 6 characters.',
        );
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
        );
      } else {
        Alert.alert(
          'Sign Up Error',
          error.message || 'Failed to sign up. Please try again.',
        );
      }
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Create Account
      </ThemedText>
      <ThemedText style={styles.subtitle}>Sign up to get started</ThemedText>

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
        placeholder="Username"
        placeholderTextColor={theme.mutedText}
        value={username}
        onChangeText={setUsername}
        editable={!loading}
        keyboardType="default"
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
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="oneTimeCode"
      />
      
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Confirm Password"
        placeholderTextColor={theme.mutedText}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!loading}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="oneTimeCode"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.tint }, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSwitchToLogin}>
        <ThemedText style={[styles.switchText, { color: theme.mutedText }]}>
          Already have an account?{' '}
          <ThemedText style={[styles.switchLink, { color: theme.tint }]}>Login</ThemedText>
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
