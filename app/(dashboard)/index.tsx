import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';

export default function DashboardScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to TanodAI</ThemedText>
      {/* Add your dashboard components here */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
}); 