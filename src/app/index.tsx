import { Redirect } from 'expo-router';
import { useAppState } from '@/state/AppState';

/** Entry point — route to the app if onboarded, otherwise to the welcome screen. */
export default function Index() {
  const { isOnboarded } = useAppState();
  return <Redirect href={isOnboarded ? '/(tabs)' : '/welcome'} />;
}
