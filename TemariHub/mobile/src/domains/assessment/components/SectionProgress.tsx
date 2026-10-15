import { StyleSheet, View } from 'react-native';

import { tokens } from '@/shared/theme';
import { Text } from '@/shared/ui';

export type SectionProgressProps = {
  subjectName: string;
  indexInSection: number;
  sectionCount: number;
};

/** Quiet runner header — e.g. "Chemistry · 12 of 25". */
export function SectionProgress({ subjectName, indexInSection, sectionCount }: SectionProgressProps) {
  return (
    <View style={styles.row} accessibilityRole="text">
      <Text variant="label" tone="brand" weight="bold">
        {subjectName}
      </Text>
      <Text variant="label" tone="secondary" weight="bold">
        {' · '}
        {indexInSection} of {sectionCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.space[0.5],
  },
});
