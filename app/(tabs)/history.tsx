import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import BackendService, { API_BASE_URL } from '../../services/BackendService';

type HistoryItem = {
  id: string | number;
  image?: string;
  image_path?: string;
  path?: string;
  result?: string;
  detection_type?: string;
  detected_issues?: string[] | string;
  scan_date?: string;
  date?: string;
  advice?: string;
  recommendations?: string[] | string;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = async () => {
    try {
      const response = await BackendService.getHistory();
      if (response.ok && response.data?.history) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('History load error:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const imagePath = item.image || item.image_path || item.path;
    const displayUri = imagePath
      ? imagePath.startsWith('http') || imagePath.startsWith('file:') || imagePath.startsWith('content:')
        ? imagePath
        : `${API_BASE_URL}${imagePath}`
      : null;
    const recommendations = Array.isArray(item.recommendations)
      ? item.recommendations.join(' ')
      : item.recommendations;
    const issues = Array.isArray(item.detected_issues)
      ? item.detected_issues.join(', ')
      : item.detected_issues;

    return (
      <View style={styles.card}>
        {displayUri ? <Image source={{ uri: displayUri }} style={styles.cardImage} /> : <View style={[styles.cardImage, styles.noImage]} />}
        <View style={styles.cardContent}>
          <Text style={styles.resultText}>{item.result || issues || item.detection_type || 'Scan result'}</Text>
          <Text style={styles.dateText}>{item.scan_date || item.date || 'Unknown date'}</Text>
          <Text style={styles.adviceText}>{item.advice || recommendations || 'No additional notes'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan History</Text>
      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
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
  noImage: { backgroundColor: '#eceff1', justifyContent: 'center', alignItems: 'center' },
  cardContent: { marginLeft: 15, flex: 1 },
  resultText: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  dateText: { fontSize: 12, color: '#888', marginVertical: 2 },
  adviceText: { fontSize: 13, color: '#555' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
});
