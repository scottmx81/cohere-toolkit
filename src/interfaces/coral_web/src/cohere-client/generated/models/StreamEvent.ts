/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Stream Events returned by Cohere's chat stream response.
 */
export enum StreamEvent {
  STREAM_START = 'stream-start',
  SEARCH_QUERIES_GENERATION = 'search-queries-generation',
  SEARCH_RESULTS = 'search-results',
  TOOL_INPUT = 'tool-input',
  TOOL_RESULT = 'tool-result',
  TEXT_GENERATION = 'text-generation',
  CITATION_GENERATION = 'citation-generation',
  STREAM_END = 'stream-end',
  NON_STREAMED_CHAT_RESPONSE = 'non-streamed-chat-response',
  TOOL_CALLS_GENERATION = 'tool-calls-generation',
  TOOL_CALLS_CHUNK = 'tool-calls-chunk',
}
