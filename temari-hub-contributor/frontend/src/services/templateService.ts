import type { Template, TemplateWriteInput } from '../types';
import { apiRequest } from './api';

export function listTemplates() {
  return apiRequest<{ templates: Template[] }>('/api/templates');
}

export function getTemplate(id: string) {
  return apiRequest<{ template: Template }>(`/api/templates/${id}`);
}

export function createTemplate(input: TemplateWriteInput) {
  return apiRequest<{ template: Template }>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTemplate(id: string, input: TemplateWriteInput) {
  return apiRequest<{ template: Template }>(`/api/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function updateTemplateStatus(id: string, isActive: boolean) {
  return apiRequest<{ template: Template }>(`/api/templates/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}
