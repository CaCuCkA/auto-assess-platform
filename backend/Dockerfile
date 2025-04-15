FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /backend

COPY backend/requirements.txt ./

RUN pip3 install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY .env .env

EXPOSE ${BACKEND_PORT}

CMD ["python3", "main.py"]
