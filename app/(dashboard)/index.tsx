import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to the Dashboard!</ThemedText>
      {user && (
        <>
          <ThemedText type="subtitle">Name: {user.user_metadata?.name}</ThemedText>
          <ThemedText type="subtitle">Last Name: {user.user_metadata?.lastName}</ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 