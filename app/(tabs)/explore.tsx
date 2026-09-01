import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Explore() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Explore Services</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dental AI Scanner</Text>
        <Text style={styles.cardText}>Scan your teeth photo and get instant AI-powered results.</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/detection')} 
        >
          <Text style={styles.buttonText}>Start Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>History</Text>
        <Text style={styles.cardText}>Review your previous scans and diagnostic reports here.</Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: '#606a8b' }]} onPress={() => router.push('/history')}>
          <Text style={styles.buttonText}>View Records</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333333',
  },
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eeeeee',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6421f3',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8b4caf',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});