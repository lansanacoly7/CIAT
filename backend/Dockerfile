# Image du back-end CIAT : utilisable sur Hugging Face Spaces (Docker), Koyeb, Railway, Fly.io, etc.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python manage.py collectstatic --no-input

# Un utilisateur non administrateur (exigé par Hugging Face Spaces, recommandé partout)
RUN useradd -m -u 1000 ciat && chown -R ciat:ciat /app
USER ciat

EXPOSE 7860
CMD ["sh", "entrypoint.sh"]
