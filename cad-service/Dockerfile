# Cardinal CAD service (docs/specs/cardinal-builder-plan.md B8, B9). Railway Root Directory = cad-service.
FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# libcairo2: CairoSVG (PDF). libgl1/libglib2.0-0/libxrender1/libgomp1: OCP + VTK wheels.
# fontconfig + fonts-liberation: Liberation Sans is metric-compatible with Arial, and fontconfig's
# 30-metric-aliases.conf maps Arial/Helvetica to it, so title-block text widths match the browser.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libcairo2 libgl1 libglib2.0-0 libxrender1 libgomp1 fontconfig fonts-liberation \
 && rm -rf /var/lib/apt/lists/* \
 && fc-cache -f

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY cpq_shared ./cpq_shared
# Pre-compile bytecode (app + site-packages) so the first `import cadquery` is not a cold compile.
RUN python -m compileall -q /app /usr/local/lib/python3.12/site-packages || true

RUN useradd --create-home --uid 10001 cad \
 && mkdir -p /tmp/cad-cache && chown cad /tmp/cad-cache
USER cad
ENV HOME=/home/cad \
    MPLCONFIGDIR=/tmp/cad-cache \
    NUMBA_CACHE_DIR=/tmp/cad-cache

EXPOSE 8080
# `::` binds IPv6 (Railway private networking) and, on Linux, IPv4 too.
CMD ["sh", "-c", "exec uvicorn app.main:app --host :: --port ${PORT:-8080} --workers 1"]
