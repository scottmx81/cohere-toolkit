from enum import StrEnum
from typing import Any, Optional

from pydantic import BaseModel, Field


class Category(StrEnum):
    FileLoader = "File loader"
    DataLoader = "Data loader"
    Function = "Function"


class ToolInput(BaseModel):
    pass


class Tool(BaseModel):
    name: str
    display_name: str = ""
    description: Optional[str] = ""
    parameter_definitions: Optional[dict] = {}


class ManagedTool(Tool):
    kwargs: dict = {}
    is_visible: bool = False
    is_available: bool = False
    error_message: Optional[str] = ""
    category: Category = Category.DataLoader
    implementation: Any = Field(exclude=True)

    class Config:
        from_attributes = True


class ToolCall(BaseModel):
    name: str
    parameters: dict = {}


class ToolCallDelta(BaseModel):
    name: str | None
    index: int | None
    parameters: str | None
