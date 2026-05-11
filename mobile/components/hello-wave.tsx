import Animated from 'react-native-reanimated';
import { useWindowDimensions } from 'react-native';

export function HelloWave() {
  const { width } = useWindowDimensions();
  const fontSize = Math.min(32, Math.max(22, Math.round(width * 0.07)));

  return (
    <Animated.Text
      style={{
        fontSize,
        lineHeight: fontSize + 6,
        marginTop: -6,
        flexShrink: 0,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}
