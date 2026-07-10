import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { catVisual } from './categoryImages';
import { radius } from './theme';
import { Category } from './types';

/**
 * Premium category thumbnail: photo with a colored-gradient fallback (shown
 * while loading or if the image fails) and a dark bottom scrim for legibility.
 */
export function CategoryThumb({
  category,
  height = 150,
  rounded = radius.lg,
  children,
  style,
}: {
  category: Category;
  height?: number;
  rounded?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const v = catVisual(category);
  const [failed, setFailed] = useState(false);

  return (
    <View
      style={[
        { height, borderTopLeftRadius: rounded, borderTopRightRadius: rounded },
        styles.wrap,
        style,
      ]}
    >
      {/* Gradient underlay — always present (also the fallback) */}
      <LinearGradient
        colors={v.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {failed ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.bigEmoji}>{v.emoji}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: v.image }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
      {/* Bottom scrim for text over image */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 48, opacity: 0.9 },
});
