# Install uv
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install `make`
RUN apt-get update && apt-get install -y make git && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser

# Change the working directory to the `app` directory
WORKDIR /app

# Copy the lockfile and `pyproject.toml` into the image
COPY ./backend/uv.lock /app/uv.lock
COPY ./backend/pyproject.toml /app/pyproject.toml

RUN mkdir -p /root/.ssh && ssh-keyscan github.com >> /root/.ssh/known_hosts

# Install dependencies
RUN --mount=type=ssh \
    uv sync --frozen --no-install-project

# Copy the project into the image
COPY ./backend/ /app

# Sync the project
RUN --mount=type=ssh \
    uv sync --frozen

COPY ./db /build/db

RUN uv pip install -e /build/db

COPY ./docker/backend.EntryPoint.sh /app/backend.EntryPoint.sh

RUN chmod +x /app/backend.EntryPoint.sh

# Add `.venv/bin` to PATH so CLI tools like uvicorn work
ENV PATH="/app/.venv/bin:$PATH"
ENV USE_DOCKER=true

RUN printf '#!/bin/sh\nexec python -m pip "$@"\n' > /usr/local/bin/pip \
    && chmod +x /usr/local/bin/pip

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port that the app will run on
EXPOSE 8000

ENTRYPOINT ["/app/backend.EntryPoint.sh"]

CMD [ "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" ]