import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CVScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Developer Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.name}>[Your Name]</Text>
        <Text style={styles.subTitle}>React Native & AI Developer</Text>
        
        <Text style={styles.sectionTitle}>Education</Text>
        <Text style={styles.text}>GCU Sargodha (Computer Science)</Text>

        <Text style={styles.sectionTitle}>Major Project</Text>
        <Text style={styles.text}>Dental Care AI: AI-based disease detection using Flask & React Native.</Text>

        <Text style={styles.sectionTitle}>Skills</Text>
        <Text style={styles.text}>• Mobile Development (Expo)</Text>
        <Text style={styles.text}>• Backend (Python Flask)</Text>
        <Text style={styles.text}>• Database (AsyncStorage)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50', textAlign: 'center' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 3 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#2980b9' },
  subTitle: { fontSize: 16, color: '#7f8c8d', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, color: '#2c3e50' },
  text: { fontSize: 14, color: '#34495e', marginTop: 5 }
});