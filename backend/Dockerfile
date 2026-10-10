# syntax=docker/dockerfile:1

# FastAPI backend image.
#
#   docker build -t <registry>/workout-tracker-backend:<tag> backend/
#
# The default command serves the API on :8000. Run migrations with the same
# image:  docker run --rm -e DATABASE_URL=... <image> alembic upgrade head

ARG PYTHON_VERSION=3.14

# --- Build stage: install dependencies into a virtualenv ---------------------
FROM python:${PYTHON_VERSION}-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install -r requirements.txt

# --- Runtime stage ------------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

RUN groupadd --system app && useradd --system --gid app --no-create-home app

WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
COPY --chown=app:app alembic.ini ./
COPY --chown=app:app alembic ./alembic
COPY --chown=app:app app ./app

USER app
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)" || exit 1

# Worker count can be set with WEB_CONCURRENCY (read by uvicorn).
# --proxy-headers: trust X-Forwarded-* from the nginx in front of it.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
