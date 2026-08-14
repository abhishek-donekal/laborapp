import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from './theme';

export interface LegalSection {
  heading: string;
  body: string[];
}

/** Shared chrome for the Terms and Privacy screens. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Last updated {updated}</Text>
        <Text style={styles.intro}>{intro}</Text>

        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.sm,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: font.h1, fontWeight: '800', color: colors.text },
  updated: { fontSize: font.small, color: colors.muted },
  intro: {
    fontSize: font.body,
    color: colors.text,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  section: { gap: spacing.sm, marginTop: spacing.xl },
  heading: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  paragraph: { fontSize: font.body, color: colors.text, lineHeight: 23 },
});
