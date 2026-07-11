export const toPqsTemplateFqn = (templateId: string): string =>
  templateId.startsWith('#') ? templateId.slice(1) : templateId;
