import type { PropsWithChildren, StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type Props = PropsWithChildren<ViewProps> & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: Props) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
