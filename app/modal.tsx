import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

// Yeh rahi wo zaroori line jo humne theek ki hai:
import { ThemedText } from '../components/ThemedText';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Modal Screen</ThemedText>
      <View style={styles.separator} />
      <ThemedText>
        Your dental app data will appear here.
      </ThemedText>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#eee',
  },
});