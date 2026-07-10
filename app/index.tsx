import { Redirect } from 'expo-router';
import { useApp } from '../src/store';

export default function Index() {
  const { user } = useApp();
  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
