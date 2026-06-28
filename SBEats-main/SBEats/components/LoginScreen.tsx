/**
 * Screen dedicated to the user login flow.
 */
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

export default function LoginScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return isLoginMode ? (
    <LoginForm onSwitchToSignUp={() => setIsLoginMode(false)} />
  ) : (
    <SignUpForm onSwitchToLogin={() => setIsLoginMode(true)} />
  );
}
