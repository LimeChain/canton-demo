import { DemoMoney } from '@daml.js/canton-demo-money-0.1.0';

import { toPqsTemplateFqn } from './money.helpers';

export const BANK_ACCOUNT_TEMPLATE = DemoMoney.BankAccount;
export const BANK_ACCOUNT_DIRECTORY_TEMPLATE = DemoMoney.BankAccountDirectory;
export const TRANSFER_INSTRUCTION_TEMPLATE = DemoMoney.TransferInstruction;

export const BANK_ACCOUNT_TEMPLATE_ID = BANK_ACCOUNT_TEMPLATE.templateId;
export const BANK_ACCOUNT_DIRECTORY_TEMPLATE_ID =
  BANK_ACCOUNT_DIRECTORY_TEMPLATE.templateId;
export const TRANSFER_INSTRUCTION_TEMPLATE_ID =
  TRANSFER_INSTRUCTION_TEMPLATE.templateId;

export const BANK_ACCOUNT_PQS_TEMPLATE_FQN = toPqsTemplateFqn(
  BANK_ACCOUNT_TEMPLATE_ID,
);
export const BANK_ACCOUNT_DIRECTORY_PQS_TEMPLATE_FQN = toPqsTemplateFqn(
  BANK_ACCOUNT_DIRECTORY_TEMPLATE_ID,
);
export const TRANSFER_INSTRUCTION_PQS_TEMPLATE_FQN = toPqsTemplateFqn(
  TRANSFER_INSTRUCTION_TEMPLATE_ID,
);
