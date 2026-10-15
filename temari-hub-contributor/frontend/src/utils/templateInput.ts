import { isSubject } from '../constants/contributors';
import { isFieldType, isTemplateType } from '../constants/templates';
import type { FieldType } from '../constants/templates';
import type { TemplateField, TemplateWriteInput } from '../types';

export type TemplateFieldDraft = {
  name: string;
  label: string;
  type: FieldType | '';
  required: boolean;
  placeholder: string;
  description: string;
  optionsText: string;
};

export type TemplateFormValues = {
  name: string;
  description: string;
  subject: string;
  type: string;
  isActive: boolean;
  fields: TemplateFieldDraft[];
};

export function emptyField(): TemplateFieldDraft {
  return {
    name: '',
    label: '',
    type: 'text',
    required: true,
    placeholder: '',
    description: '',
    optionsText: '',
  };
}

export function fieldsToDrafts(fields: TemplateField[]): TemplateFieldDraft[] {
  return [...fields]
    .sort((left, right) => left.order - right.order)
    .map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder,
      description: field.description,
      optionsText: field.options.join('\n'),
    }));
}

export function buildTemplateInput(values: TemplateFormValues): TemplateWriteInput | string {
  if (!isSubject(values.subject)) {
    return 'Subject is required';
  }

  if (!isTemplateType(values.type)) {
    return 'Choose a template type';
  }

  if (values.fields.length === 0) {
    return 'Add at least one field';
  }

  const fields: TemplateField[] = [];

  for (const [index, field] of values.fields.entries()) {
    if (!isFieldType(field.type)) {
      return `Field ${index + 1} needs a type`;
    }

    const options =
      field.type === 'select'
        ? field.optionsText
            .split('\n')
            .map((option) => option.trim())
            .filter(Boolean)
        : [];

    fields.push({
      name: field.name.trim(),
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      order: index + 1,
      placeholder: field.placeholder.trim(),
      description: field.description.trim(),
      options,
    });
  }

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    subject: values.subject,
    type: values.type,
    fields,
    isActive: values.isActive,
  };
}
