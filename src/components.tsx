import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, radius, spacing } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const v = variantStyles[variant];
  const isOff = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isOff && { opacity: 0.85 },
        isOff && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[styles.btnText, { color: v.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const variantStyles: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string }
> = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
  danger: { bg: colors.dangerTint, fg: colors.danger, border: colors.dangerTint },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'primary';
}) {
  const map = {
    neutral: { bg: colors.surface, fg: colors.muted },
    success: { bg: colors.successTint, fg: colors.success },
    danger: { bg: colors.dangerTint, fg: colors.danger },
    warning: { bg: colors.warningTint, fg: colors.warning },
    primary: { bg: colors.primaryTint, fg: colors.primaryDark },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnText: { fontSize: font.body, fontWeight: '700' },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: font.tiny, fontWeight: '700', textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  label: { fontSize: font.small, fontWeight: '600', color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  emptySub: {
    fontSize: font.body,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
