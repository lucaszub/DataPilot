"""AI router -- text-to-SQL endpoint using Claude API."""

import logging

import anthropic
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.dashboard import SemanticLayer
from app.models.user import User
from app.schemas.ai import AIQueryRequest, AIQueryResponse
from app.services.ai_service import AIService
from app.services.query_service import SemanticQueryBuilder

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=AIQueryResponse)
async def ai_query(
    data: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id

    # 1. Retrieve semantic layer (tenant-isolated)
    semantic_layer = (
        db.query(SemanticLayer)
        .filter(
            SemanticLayer.workspace_id == data.workspace_id,
            SemanticLayer.tenant_id == tenant_id,
        )
        .first()
    )
    if not semantic_layer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No semantic model found for this workspace",
        )

    if not semantic_layer.definitions_json:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Semantic layer has no definitions configured",
        )

    definitions = semantic_layer.definitions_json

    # 2. Check AI service availability
    ai_service = AIService()
    try:
        ai_service._ensure_client()
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    # 3. Generate SQL via Claude
    try:
        ai_result = await ai_service.generate_sql(
            question=data.question,
            semantic_context=definitions,
        )
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service rate limited. Please retry later.",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"AI generation error: {str(e)}",
        )
    except Exception as e:
        logger.error("AI generation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )

    generated_sql = ai_result["sql"]
    explanation = ai_result["explanation"]
    suggested_chart = ai_result.get("suggested_chart")

    # 4. Execute SQL via SemanticQueryBuilder
    builder = SemanticQueryBuilder()
    try:
        builder.setup_context(
            definitions_json=definitions,
            tenant_id=tenant_id,
            db=db,
        )
        results = builder.execute_query(sql_text=generated_sql, limit=1000)
    except (ValueError, TimeoutError) as first_error:
        # Retry once with error context
        logger.warning(
            "First SQL attempt failed, retrying. SQL: %s, Error: %s",
            generated_sql,
            first_error,
        )
        builder.close()
        builder = SemanticQueryBuilder()
        try:
            ai_retry = await ai_service.generate_sql_with_retry(
                question=data.question,
                semantic_context=definitions,
                error_message=str(first_error),
                previous_sql=generated_sql,
            )
            generated_sql = ai_retry["sql"]
            explanation = ai_retry["explanation"]
            suggested_chart = ai_retry.get("suggested_chart")

            builder.setup_context(
                definitions_json=definitions,
                tenant_id=tenant_id,
                db=db,
            )
            results = builder.execute_query(
                sql_text=generated_sql, limit=1000
            )
        except ValueError as retry_error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SQL generation failed after retry: {str(retry_error)}",
            )
        except TimeoutError as retry_error:
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail=str(retry_error),
            )
        except Exception as retry_error:
            logger.error("Retry also failed: %s", retry_error)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SQL generation failed after retry: {str(retry_error)}",
            )
        finally:
            builder.close()
    except RuntimeError as e:
        builder.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    else:
        builder.close()

    # 5. Fallback chart suggestion via heuristic
    if not suggested_chart:
        suggested_chart = ai_service.suggest_chart_type(
            columns=results["columns"],
            row_count=results["row_count"],
        )

    return AIQueryResponse(
        sql=generated_sql,
        explanation=explanation,
        results={
            "columns": results["columns"],
            "rows": results["rows"],
            "row_count": results["row_count"],
            "execution_time_ms": results["execution_time_ms"],
        },
        suggested_chart=suggested_chart,
    )
