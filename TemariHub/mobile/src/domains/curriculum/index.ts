/** Public API for the curriculum domain. Cross-domain imports must use this barrel. */
export { fetchSubjectUnits, fetchSubjects, fetchTopic, fetchUnitTopics } from './api';
export { SubjectScreen } from './screens/SubjectScreen';
export { SubjectsScreen } from './screens/SubjectsScreen';
export { TopicScreen } from './screens/TopicScreen';
export { useSubjectUnits } from './hooks/useSubjectUnits';
export { useSubjects } from './hooks/useSubjects';
export { useTopic } from './hooks/useTopic';
export { useUnitTopics } from './hooks/useUnitTopics';
export type {
  Subject,
  SubjectUnitsList,
  SubjectsList,
  SubjectsQuery,
  TopicDetail,
  TopicListItem,
  TopicPrerequisite,
  TopicResource,
  Unit,
  UnitTopicsList,
} from './types';
