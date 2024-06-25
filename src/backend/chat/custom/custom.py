import logging
from itertools import tee
from typing import Any, Dict, Generator, List

from fastapi import HTTPException

from backend.chat.base import BaseChat
from backend.chat.collate import rerank_and_chunk, to_dict
from backend.chat.custom.utils import get_deployment
from backend.chat.enums import StreamEvent
from backend.config.tools import AVAILABLE_TOOLS, ToolName
from backend.crud.file import get_files_by_conversation_id
from backend.schemas.chat import ChatMessage
from backend.schemas.cohere_chat import CohereChatRequest
from backend.schemas.tool import Tool
from backend.services.logger import get_logger

logger = get_logger()
MAX_STEPS = 15


class CustomChat(BaseChat):
    """Custom chat flow not using integrations for models."""

    def chat(self, chat_request: CohereChatRequest, **kwargs: Any) -> Any:
        """
        Chat flow for custom models.

        Args:
            chat_request (CohereChatRequest): Chat request.
            **kwargs (Any): Keyword arguments.

        Returns:
            Generator[StreamResponse, None, None]: Chat response.
        """
        # Choose the deployment model - validation already performed by request validator
        deployment_model = get_deployment(kwargs.get("deployment_name"), **kwargs)
        logger.info(f"Using deployment {deployment_model.__class__.__name__}")

        if len(chat_request.tools) > 0 and len(chat_request.documents) > 0:
            raise HTTPException(
                status_code=400, detail="Both tools and documents cannot be provided."
            )

        self.chat_request = chat_request
        self.is_first_start = True
        should_break = False

        for step in range(MAX_STEPS):
            logger.info(f"Step {step + 1}")
            try:
                stream = self.call_chat(self.chat_request, deployment_model, **kwargs)

                for event in stream:
                    result = self.handle_event(event, chat_request)

                    if result:
                        yield result

                    if event[
                        "event_type"
                    ] == StreamEvent.STREAM_END and self.is_final_event(
                        event, chat_request
                    ):
                        should_break = True
                        break
            except Exception as e:
                yield {
                    "event_type": StreamEvent.STREAM_END,
                    "finish_reason": "ERROR",
                    "error": str(e),
                    "status_code": 500,
                }
                should_break = True

            if should_break:
                break

    def is_final_event(
        self, event: Dict[str, Any], chat_request: CohereChatRequest
    ) -> bool:
        # The event is final if:
        # 1. It is a stream end event with no tool calls - direct answer
        # 2. It is a stream end event with tool calls, but no managed tools - tool calls generation only
        if "response" in event:
            response = event["response"]
        else:
            return True

        return not ("tool_calls" in response and response["tool_calls"]) or (
            "tool_calls" in response
            and response["tool_calls"]
            and chat_request.tools
            and not self.get_managed_tools(self.chat_request)
        )

    def handle_event(
        self, event: Dict[str, Any], chat_request: CohereChatRequest
    ) -> Dict[str, Any]:
        # All events other than stream start and stream end are returned
        if (
            event["event_type"] != StreamEvent.STREAM_START
            and event["event_type"] != StreamEvent.STREAM_END
        ):
            return event

        # Only the first occurrence of stream start is returned
        if event["event_type"] == StreamEvent.STREAM_START:
            if self.is_first_start:
                self.is_first_start = False
                return event

        # Only the final occurrence of stream end is returned
        # The final event is the one that does not contain tool calls
        if event["event_type"] == StreamEvent.STREAM_END:
            if self.is_final_event(event, chat_request):
                return event

        return None

    def is_not_direct_answer(self, event: Dict[str, Any]) -> bool:
        # If the event contains tool calls, it is not a direct answer
        return (
            event["event_type"] == StreamEvent.TOOL_CALLS_GENERATION
            and "tool_calls" in event
        )

    def call_chat(self, chat_request, deployment_model, **kwargs: Any):
        trace_id = kwargs.get("trace_id", "")
        user_id = kwargs.get("user_id", "")
        agent_id = kwargs.get("agent_id", "")
        managed_tools = self.get_managed_tools(chat_request)

        # If tools are managed and not zero shot tools, replace the tools in the chat request
        if len(managed_tools) == len(chat_request.tools):
            chat_request.tools = managed_tools

        # Get the tool calls stream and either return a direct answer or continue
        tool_calls_stream = self.get_tool_calls(
            managed_tools, chat_request.chat_history, deployment_model, **kwargs
        )
        is_direct_answer, new_chat_history, stream = self.handle_tool_calls_stream(
            tool_calls_stream
        )

        for event in stream:
            yield event

        if is_direct_answer:
            return

        # If the stream contains tool calls, call the tools and update the chat history
        tool_results = self.call_tools(new_chat_history, deployment_model, **kwargs)
        chat_request.tool_results = [result for result in tool_results]
        chat_request.chat_history = new_chat_history

        # Remove the message if tool results are present
        if tool_results:
            chat_request.message = ""

        for event in deployment_model.invoke_chat_stream(
            chat_request, trace_id=trace_id, user_id=user_id, agent_id=agent_id
        ):
            if event["event_type"] != StreamEvent.STREAM_START:
                yield event
            if event["event_type"] == StreamEvent.STREAM_END:
                chat_request.chat_history = event["response"].get("chat_history", [])

        # Update the chat request and restore the message
        self.chat_request = chat_request

    def call_tools(self, chat_history, deployment_model, **kwargs: Any):
        tool_results = []
        if not hasattr(chat_history[-1], "tool_results"):
            logging.warning("No tool calls found in chat history.")
            return tool_results

        tool_calls = chat_history[-1].tool_calls
        logger.info(f"Tool calls: {tool_calls}")

        # TODO: Call tools in parallel
        for tool_call in tool_calls:
            tool = AVAILABLE_TOOLS.get(tool_call["name"])
            if not tool:
                logging.warning(f"Couldn't find tool {tool_call['name']}")
                continue

            outputs = tool.implementation().call(
                parameters=tool_call.get("parameters"),
                session=kwargs.get("session"),
                model_deployment=deployment_model,
                user_id=kwargs.get("user_id"),
            )

            # If the tool returns a list of outputs, append each output to the tool_results list
            # Otherwise, append the single output to the tool_results list
            outputs = outputs if isinstance(outputs, list) else [outputs]
            for output in outputs:
                tool_results.append({"call": tool_call, "outputs": [output]})

        tool_results = rerank_and_chunk(tool_results, deployment_model, **kwargs)
        return tool_results

    def handle_tool_calls_stream(self, tool_results_stream):
        # Process the stream and return the chat history, and a copy of the stream and a flag indicating if the response is a direct answer
        stream, stream_copy = tee(tool_results_stream)
        is_direct_answer = True

        chat_history = []
        for event in stream:
            if event["event_type"] == StreamEvent.STREAM_END:
                stream_chat_history = []
                if "response" in event:
                    stream_chat_history = event["response"].get("chat_history", [])
                elif "chat_history" in event:
                    stream_chat_history = event["chat_history"]

                for message in stream_chat_history:
                    if not isinstance(message, dict):
                        message = to_dict(message)

                    chat_history.append(
                        ChatMessage(
                            role=message.get("role"),
                            message=message.get("message", ""),
                            tool_results=message.get("tool_results", None),
                            tool_calls=message.get("tool_calls", None),
                        )
                    )

            elif (
                event["event_type"] == StreamEvent.TOOL_CALLS_GENERATION
                and "tool_calls" in event
            ):
                is_direct_answer = False

        return is_direct_answer, chat_history, stream_copy

    def get_managed_tools(self, chat_request: CohereChatRequest):
        return [
            Tool(**AVAILABLE_TOOLS.get(tool.name).model_dump())
            for tool in chat_request.tools
            if AVAILABLE_TOOLS.get(tool.name)
        ]

    def get_tool_calls(self, tools, chat_history, deployment_model, **kwargs: Any):
        trace_id = kwargs.get("trace_id", "")
        user_id = kwargs.get("user_id", "")
        agent_id = kwargs.get("agent_id", "")
        # If the chat history contains a read or search file tool, add the files to the chat history
        tool_names = [tool.name for tool in tools]
        if ToolName.Read_File in tool_names or ToolName.Search_File in tool_names:
            chat_history = self.add_files_to_chat_history(
                chat_history,
                kwargs.get("conversation_id"),
                kwargs.get("session"),
                kwargs.get("user_id"),
            )
            self.chat_request.chat_history = chat_history

        logger.info(f"Available tools: {tools}")
        stream = deployment_model.invoke_chat_stream(
            self.chat_request, trace_id=trace_id, user_id=user_id, agent_id=agent_id
        )

        return stream

    def add_files_to_chat_history(
        self,
        chat_history: List[Dict[str, str]],
        conversation_id: str,
        session: Any,
        user_id: str,
    ) -> List[Dict[str, str]]:
        if session is None or conversation_id is None or len(conversation_id) == 0:
            return chat_history

        available_files = get_files_by_conversation_id(
            session, conversation_id, user_id
        )
        files_message = "The user uploaded the following attachments:\n"

        for file in available_files:
            word_count = len(file.file_content.split())

            # Use the first 25 words as the document preview in the preamble
            num_words = min(25, word_count)
            preview = " ".join(file.file_content.split()[:num_words])

            files_message += f"Filename: {file.file_name}\nWord Count: {word_count} Preview: {preview}\n\n"

        chat_history.append(ChatMessage(message=files_message, role="SYSTEM"))
        return chat_history
