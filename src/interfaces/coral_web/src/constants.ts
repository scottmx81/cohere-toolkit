import { IconName } from '@/components/Shared';
import { FileAccept } from '@/components/Shared/DragDropFileInput';

export const DEFAULT_CONVERSATION_NAME = 'New Conversation';
export const DEFAULT_TYPING_VELOCITY = 35;

export const DEPLOYMENT_COHERE_PLATFORM = 'Cohere Platform';
export const DEFAULT_AGENT_MODEL = 'command-r-plus';

export const ACCEPTED_FILE_TYPES: FileAccept[] = [
  'text/csv',
  'text/plain',
  'text/html',
  'text/markdown',
  'text/tab-separated-values',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
  'application/pdf',
  'application/epub+zip',
];

/**
 * Special HTML ids and CSS classes
 */
// Classes used to identify certain elements
export enum ReservedClasses {
  MESSAGES = 'messages',
  CITATION_PANEL = 'side-panel',
  MESSAGE = 'message',
  CITATION = 'citation',
}
export const CHAT_COMPOSER_TEXTAREA_ID = 'composer';
export const CONFIGURATION_FILE_UPLOAD_ID = 'file-upload';
export const CONFIGURATION_PANEL_ID = 'configuration';

/**
 * Local Storage
 */
export const LOCAL_STORAGE_KEYS = {
  welcomeGuideState: 'onboarding/welcome/onboardState',
  welcomeGuideInfoBox: 'onboarding/welcome/infoBox',
};

/**
 * Tools
 */
export const TOOL_INTERNET_SEARCH_ID = 'Internet_Search';
export const TOOL_PYTHON_INTERPRETER_ID = 'Python_Interpreter';
export const TOOL_CALCULATOR_ID = 'Calculator';

export const TOOL_FALLBACK_ICON = 'circles-four';
export const TOOL_ID_TO_DISPLAY_INFO: { [id: string]: { name: string; icon: IconName } } = {
  [TOOL_INTERNET_SEARCH_ID]: { name: 'Internet Search', icon: 'search' },
  [TOOL_PYTHON_INTERPRETER_ID]: { name: 'Python Interpreter', icon: 'code' },
  [TOOL_CALCULATOR_ID]: { name: 'Calculator', icon: 'calculator' },
};
