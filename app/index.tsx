import { Redirect } from 'expo-router';
import { useApp } from '../src/store';

export default function Index() {
  const { user, needsRole } = useApp();
  if (user) return <Redirect href="/(tabs)" />;
  if (needsRole) return <Redirect href="/onboarding" />;
  return <Redirect href="/login" />;
}
