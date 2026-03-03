# Deploy Landing to Cloudflare Pages (GitHub)

Этот проект содержит статический сайт в папке `site/`:

- `/` — лендинг
- `/swagger` — Swagger UI
- `/redoc` — ReDoc
- `/openapi.yaml` — OpenAPI спецификация

## 1. Подготовка

1. Запушьте репозиторий в GitHub.
2. Убедитесь, что папка `site/` находится в ветке, которую будете деплоить.

## 2. Создание Pages проекта

1. Откройте Cloudflare Dashboard.
2. `Workers & Pages` -> `Create` -> `Pages` -> `Connect to Git`.
3. Выберите ваш GitHub репозиторий.

## 3. Build settings

Используйте настройки:

- **Framework preset**: `None`
- **Build command**: оставить пустым
- **Build output directory**: `site`
- **Root directory**: `/` (по умолчанию)

## 4. После деплоя

Проверьте URL:

- `https://<your-pages-domain>/`
- `https://<your-pages-domain>/swagger`
- `https://<your-pages-domain>/redoc`
- `https://<your-pages-domain>/openapi.yaml`

## 5. Подключение реального API

По умолчанию в `site/openapi.yaml` указан placeholder сервер:

```yaml
servers:
  - url: https://your-api-domain.example
```

Замените его на ваш прод API домен (например, Vercel URL):

```yaml
servers:
  - url: https://your-vercel-app.vercel.app
```

После этого Swagger/ReDoc начнут отправлять запросы в ваш API.

## 6. CORS (если нужно)

Если frontend-домен Cloudflare Pages и API-домен отличаются,
убедитесь, что API отвечает с корректными CORS заголовками.
