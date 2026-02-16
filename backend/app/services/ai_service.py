"""AI service -- Claude API integration for text-to-SQL."""

import json
import logging
import re

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
Tu es un assistant SQL expert pour DataPilot, specialise en DuckDB.

REGLES STRICTES :
1. Genere UNIQUEMENT du SQL SELECT valide pour DuckDB.
2. Pas de DROP, DELETE, INSERT, UPDATE, CREATE, ALTER, TRUNCATE, ou toute operation d'ecriture.
3. Utilise des guillemets doubles pour les noms de vues et colonnes contenant des caracteres speciaux.
4. Limite les resultats a 1000 lignes maximum (LIMIT 1000).
5. Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres.

FORMAT DE REPONSE (JSON strict) :
{
  "sql": "SELECT ...",
  "explanation": "Explication courte en francais de ce que fait la requete",
  "suggested_chart": "bar|line|pie|kpi|table"
}

Regles pour suggested_chart :
- "kpi" : 1 seule valeur numerique (COUNT, SUM, AVG...)
- "line" : colonne date/temporelle + valeur(s) numerique(s)
- "bar" : colonne categorielle + valeur(s) numerique(s)
- "pie" : colonne categorielle + proportion/pourcentage (max 10 categories)
- "table" : plusieurs colonnes sans pattern clair, ou listes detaillees
"""


class AIService:
    """Text-to-SQL service using Claude API."""

    def __init__(self) -> None:
        if not settings.anthropic_api_key:
            self._client: anthropic.Anthropic | None = None
        else:
            self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def _ensure_client(self) -> anthropic.Anthropic:
        """Return the Anthropic client, raising if not configured."""
        if self._client is None:
            raise RuntimeError(
                "AI service not configured: ANTHROPIC_API_KEY is missing"
            )
        return self._client

    async def generate_sql(
        self,
        question: str,
        semantic_context: dict,
        dialect: str = "duckdb",
    ) -> dict:
        """Send the question + schema context to Claude and get SQL back.

        Args:
            question: Natural language question from the user.
            semantic_context: The definitions_json from the semantic layer.
            dialect: SQL dialect (default: duckdb).

        Returns:
            Dict with keys: sql, explanation, suggested_chart.

        Raises:
            RuntimeError: If API key is missing.
            ValueError: If Claude returns unparseable JSON.
            anthropic.RateLimitError: If Anthropic rate-limits us.
        """
        client = self._ensure_client()
        schema_prompt = self.build_schema_prompt(semantic_context)

        user_message = (
            f"Schema de la base de donnees :\n{schema_prompt}\n\n"
            f"Dialecte SQL : {dialect}\n\n"
            f"Question de l'utilisateur : {question}"
        )

        response = client.messages.create(
            model=settings.claude_model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_text = response.content[0].text.strip()
        return self._parse_response(raw_text)

    async def generate_sql_with_retry(
        self,
        question: str,
        semantic_context: dict,
        error_message: str,
        previous_sql: str,
        dialect: str = "duckdb",
    ) -> dict:
        """Retry SQL generation with the error context from the first attempt.

        Args:
            question: Original user question.
            semantic_context: The definitions_json from the semantic layer.
            error_message: Error from executing the first SQL attempt.
            previous_sql: The SQL that failed.
            dialect: SQL dialect (default: duckdb).

        Returns:
            Dict with keys: sql, explanation, suggested_chart.
        """
        client = self._ensure_client()
        schema_prompt = self.build_schema_prompt(semantic_context)

        user_message = (
            f"Schema de la base de donnees :\n{schema_prompt}\n\n"
            f"Dialecte SQL : {dialect}\n\n"
            f"Question de l'utilisateur : {question}\n\n"
            f"ATTENTION : Ma premiere tentative de SQL a echoue.\n"
            f"SQL precedent : {previous_sql}\n"
            f"Erreur obtenue : {error_message}\n\n"
            f"Corrige le SQL en tenant compte de l'erreur."
        )

        response = client.messages.create(
            model=settings.claude_model,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_text = response.content[0].text.strip()
        return self._parse_response(raw_text)

    def build_schema_prompt(self, definitions_json: dict) -> str:
        """Build a text description of the schema from the semantic layer definitions.

        Formats tables with their columns (name, type, role) and relations (joins).
        """
        lines: list[str] = []
        nodes = definitions_json.get("nodes", [])
        edges = definitions_json.get("edges", [])

        # Build a map of node id -> source name for edge resolution
        node_id_to_name: dict[str, str] = {}

        for node in nodes:
            data = node.get("data", {})
            source_name = (
                node.get("data_source_name")
                or data.get("source_name")
                or data.get("label", "unknown")
            )
            node_id = node.get("id", "")
            node_id_to_name[node_id] = source_name

            # Sanitize name same way as SemanticQueryBuilder
            safe_name = re.sub(r"[^a-zA-Z0-9_]", "_", source_name)[:128]

            columns = data.get("columns", [])
            if not columns:
                lines.append(f'Table "{safe_name}" (pas de colonnes definies)')
                continue

            lines.append(f'Table "{safe_name}" :')
            for col in columns:
                col_name = col.get("name", "?")
                col_type = col.get("type", "?")
                col_role = col.get("role", "")
                role_str = f" [{col_role}]" if col_role else ""
                lines.append(f"  - {col_name} ({col_type}){role_str}")
            lines.append("")

        # Relations
        if edges:
            lines.append("Relations (JOINs) :")
            for edge in edges:
                source_id = edge.get("source", "")
                target_id = edge.get("target", "")
                edge_data = edge.get("data", {})
                join_type = edge_data.get("join_type", "INNER JOIN")
                source_col = edge_data.get("source_column", "?")
                target_col = edge_data.get("target_column", "?")
                source_table = node_id_to_name.get(source_id, source_id)
                target_table = node_id_to_name.get(target_id, target_id)
                safe_source = re.sub(r"[^a-zA-Z0-9_]", "_", source_table)[:128]
                safe_target = re.sub(r"[^a-zA-Z0-9_]", "_", target_table)[:128]
                lines.append(
                    f'  "{safe_source}".{source_col}'
                    f" {join_type}"
                    f' "{safe_target}".{target_col}'
                )
            lines.append("")

        return "\n".join(lines)

    def suggest_chart_type(
        self, columns: list[dict], row_count: int
    ) -> str | None:
        """Suggest a chart type based on result columns and row count.

        Args:
            columns: List of dicts with 'name' and 'type' keys.
            row_count: Number of rows in the result.

        Returns:
            Suggested chart type string or None.
        """
        if not columns or row_count == 0:
            return None

        numeric_types = {
            "BIGINT", "INTEGER", "DOUBLE", "FLOAT", "DECIMAL",
            "HUGEINT", "SMALLINT", "TINYINT", "REAL", "NUMERIC",
        }
        date_types = {
            "DATE", "TIMESTAMP", "TIMESTAMP WITH TIME ZONE",
            "TIMESTAMPTZ", "TIMESTAMP_S", "TIMESTAMP_MS", "TIMESTAMP_NS",
        }
        text_types = {"VARCHAR", "TEXT", "STRING"}

        numeric_cols = [
            c for c in columns if c.get("type", "").upper() in numeric_types
        ]
        date_cols = [
            c for c in columns if c.get("type", "").upper() in date_types
        ]
        text_cols = [
            c for c in columns if c.get("type", "").upper() in text_types
        ]

        # Single numeric value -> KPI
        if row_count == 1 and len(numeric_cols) == 1 and len(columns) <= 2:
            return "kpi"

        # Date + numeric -> line chart
        if date_cols and numeric_cols:
            return "line"

        # Category + single numeric -> bar or pie
        if text_cols and numeric_cols:
            if row_count <= 10 and len(numeric_cols) == 1:
                return "pie"
            return "bar"

        # Fallback
        return "table"

    def _parse_response(self, raw_text: str) -> dict:
        """Parse Claude's JSON response, handling markdown code blocks."""
        cleaned = raw_text
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```\s*$", "", cleaned)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(
                "Failed to parse Claude response: %s\nRaw: %s", e, raw_text
            )
            raise ValueError(
                f"Claude returned invalid JSON. Raw response: {raw_text[:500]}"
            ) from e

        sql = parsed.get("sql")
        if not sql or not isinstance(sql, str):
            raise ValueError("Claude response missing 'sql' field")

        explanation = parsed.get("explanation", "")
        suggested_chart = parsed.get("suggested_chart")

        valid_charts = {"bar", "line", "pie", "kpi", "table"}
        if suggested_chart and suggested_chart not in valid_charts:
            suggested_chart = None

        return {
            "sql": sql.strip(),
            "explanation": explanation,
            "suggested_chart": suggested_chart,
        }
