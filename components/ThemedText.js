import { Text, StyleSheet } from 'react-native';

export function ThemedText({ style, type, ...rest }) {
  return (
    <Text
      style={[
        styles.default,
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16, color: '#000' },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 20, fontWeight: 'bold' },
});