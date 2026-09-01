import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const isFocused = useIsFocused();

  // Function to load history
  const loadHistory = async () => {
    const savedHistory = await AsyncStorage.getItem('dentalHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  };

  // Refresh history when the screen becomes active
  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  // Aik single history item ka design
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.resultText}>{item.result}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.adviceText}>{item.advice}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan History</Text>
      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.emptyText}>No history available yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', marginBottom: 20, textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 15, elevation: 3 },
  cardImage: { width: 70, height: 70, borderRadius: 10 },
  cardContent: { marginLeft: 15, flex: 1 },
  resultText: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  dateText: { fontSize: 12, color: '#888', marginVertical: 2 },
  adviceText: { fontSize: 13, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});