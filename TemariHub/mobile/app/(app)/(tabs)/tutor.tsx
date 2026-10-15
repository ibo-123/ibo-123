import { Redirect } from 'expo-router';

import { env } from '@/config/env';
import { TabPlaceholder } from '@/shared/lib';

export default function Route() {
  if (!env.featureTutorTab) {
    return <Redirect href="/(app)/(tabs)/today" />;
  }
  return <TabPlaceholder title="Tutor" />;
}
