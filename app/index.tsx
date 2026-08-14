import { Redirect } from 'expo-router';
import { useApp } from '../src/store';

export default function Index() {
  const { user, needsRole, isGuest } = useApp();
  if (user) return <Redirect href="/(tabs)" />;
  if (needsRole) return <Redirect href="/onboarding" />;
  if (isGuest) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
