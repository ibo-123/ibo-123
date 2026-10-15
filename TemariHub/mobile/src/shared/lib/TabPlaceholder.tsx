import { Screen } from '@/shared/ui';

import { ComingSoon } from './ComingSoon';

type TabPlaceholderProps = {
  title: string;
};

/** Tab shell stand-in. The real screen arrives in a later issue. */
export function TabPlaceholder({ title }: TabPlaceholderProps) {
  return (
    <Screen edges={['top']} padded={false}>
      <ComingSoon title={title} />
    </Screen>
  );
}
