import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/shared/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Sheet({ visible, onClose, title, children, style }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.panel,
            tokens.shadow.card,
            { paddingBottom: Math.max(insets.bottom, tokens.space[4]) },
            style,
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text variant="title" tone="primary" style={styles.title}>
                {title}
              </Text>
              <IconButton accessibilityLabel="Close" onPress={onClose} variant="subtle">
                <Text variant="title" tone="secondary" align="center">
                  ×
                </Text>
              </IconButton>
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: tokens.zIndex.sheet,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: tokens.color.overlay,
  },
  panel: {
    backgroundColor: tokens.color.surface.raised,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.space[6],
    paddingTop: tokens.space[3],
    maxHeight: tokens.layout.sheetMaxHeight,
  },
  handle: {
    alignSelf: 'center',
    width: tokens.space[10],
    height: tokens.space[1],
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.border.default,
    marginBottom: tokens.space[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.space[4],
    gap: tokens.space[3],
  },
  title: {
    flex: 1,
  },
  body: {
    gap: tokens.space[4],
  },
});
