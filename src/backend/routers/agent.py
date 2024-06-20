from fastapi import APIRouter, Depends, Form, HTTPException, Request

from backend.config.routers import RouterName
from backend.crud import agent as agent_crud
from backend.database_models.agent import Agent as AgentModel
from backend.database_models.database import DBSessionDep
from backend.schemas.agent import Agent, CreateAgent, DeleteAgent, UpdateAgent
from backend.services.auth.utils import get_header_user_id
from backend.services.request_validators import (
    validate_create_agent_request,
    validate_update_agent_request,
    validate_user_header,
)

router = APIRouter(
    prefix="/v1/agents",
)
router.name = RouterName.AGENT


@router.post(
    "",
    response_model=Agent,
    dependencies=[
        Depends(validate_user_header),
        Depends(validate_create_agent_request),
    ],
)
def create_agent(session: DBSessionDep, agent: CreateAgent, request: Request) -> Agent:
    user_id = get_header_user_id(request)

    agent_data = AgentModel(
        name=agent.name,
        description=agent.description,
        preamble=agent.preamble,
        temperature=agent.temperature,
        user_id=user_id,
        model=agent.model,
        deployment=agent.deployment,
        tools=agent.tools,
    )

    try:
        return agent_crud.create_agent(session, agent_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[Agent])
async def list_agents(
    *, offset: int = 0, limit: int = 100, session: DBSessionDep, request: Request
) -> list[Agent]:
    """
    List all agents.

    Args:
        offset (int): Offset to start the list.
        limit (int): Limit of agents to be listed.
        session (DBSessionDep): Database session.
        request (Request): Request object.

    Returns:
        list[Agent]: List of agents.
    """
    try:
        return agent_crud.get_agents(session, offset=offset, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}", response_model=Agent)
async def get_agent_by_id(
    agent_id: str, session: DBSessionDep, request: Request
) -> Agent:
    """
    Args:
        agent_id (str): Agent ID.
        session (DBSessionDep): Database session.

    Returns:
        Agent: Agent.

    Raises:
        HTTPException: If the agent with the given ID is not found.
    """
    try:
        agent = agent_crud.get_agent_by_id(session, agent_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID: {agent_id} not found.",
        )

    return agent


@router.put(
    "/{agent_id}",
    response_model=Agent,
    dependencies=[
        Depends(validate_user_header),
        Depends(validate_update_agent_request),
    ],
)
async def update_agent(
    agent_id: str,
    new_agent: UpdateAgent,
    session: DBSessionDep,
    request: Request,
) -> Agent:
    """
    Update an agent by ID.

    Args:
        agent_id (str): Agent ID.
        new_agent (UpdateAgent): New agent data.
        session (DBSessionDep): Database session.
        request (Request): Request object.

    Returns:
        Agent: Updated agent.

    Raises:
        HTTPException: If the agent with the given ID is not found.
    """
    agent = agent_crud.get_agent_by_id(session, agent_id)

    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID: {agent_id} not found.",
        )

    try:
        agent = agent_crud.update_agent(session, agent, new_agent)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return agent


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str, session: DBSessionDep, request: Request
) -> DeleteAgent:
    """
    Delete an agent by ID.

    Args:
        agent_id (str): Agent ID.
        session (DBSessionDep): Database session.
        request (Request): Request object.

    Returns:
        DeleteAgent: Empty response.

    Raises:
        HTTPException: If the agent with the given ID is not found.
    """
    agent = agent_crud.get_agent_by_id(session, agent_id)

    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID: {agent_id} not found.",
        )

    try:
        agent_crud.delete_agent(session, agent_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return DeleteAgent()
