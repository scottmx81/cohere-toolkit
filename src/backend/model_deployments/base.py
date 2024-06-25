from abc import abstractmethod
from typing import Any, Dict, Generator, List

from cohere.types import StreamedChatResponse

from backend.schemas.cohere_chat import CohereChatRequest
from backend.schemas.metrics import MetricsData


class BaseDeployment:
    """Base for all model deployment options.

    rerank_enabled: bool: Whether the deployment supports reranking.
    invoke_chat_stream: Generator[StreamedChatResponse, None, None]: Invoke the chat stream.
    invoke_rerank: Any: Invoke the rerank.
    list_models: List[str]: List all models.
    is_available: bool: Check if the deployment is available.
    """

    @property
    @abstractmethod
    def rerank_enabled(self) -> bool: ...

    @staticmethod
    def list_models() -> List[str]: ...

    @staticmethod
    def is_available() -> bool: ...

    @abstractmethod
    def invoke_chat(self, chat_request: CohereChatRequest, **kwargs: Any) -> Any: ...

    @abstractmethod
    def invoke_chat_stream(
        self, chat_request: CohereChatRequest, **kwargs: Any
    ) -> Generator[StreamedChatResponse, None, None]: ...

    @abstractmethod
    def invoke_rerank(
        self, query: str, documents: List[Dict[str, Any]], **kwargs: Any
    ) -> Any: ...
