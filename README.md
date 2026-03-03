# Project Power API

API для получения информации о плановых и фактических отключениях электроэнергии от DTEK по адресу.

## Онлайн документация

- Лендинг: `https://power-six-lemon.vercel.app/`
- Swagger UI: `https://power-six-lemon.vercel.app/swagger`
- ReDoc: `https://power-six-lemon.vercel.app/redoc`
- OpenAPI YAML: `https://power-six-lemon.vercel.app/openapi.yaml`

## Что внутри

- Backend API на TypeScript (`api/`, `src/`)
- Тесты на Vitest (`tests/`)
- Публичный статический лендинг с документацией (`site/`)
  - `/` — landing page
  - `/swagger` — Swagger UI
  - `/redoc` — ReDoc
  - `/openapi.yaml` — OpenAPI спецификация

## API

`GET /api/power`

### Query-параметры

- `city` (string, optional, default: `Ваш город`)
- `street` (string, optional, default: `Ваша улица`)
- `house` (string, required)

Пример:

```http
GET /api/power?city=Ваш%20город&street=Ваша%20улица&house=1
```

### Пример ответа

```json
{
  "ok": true,
  "address": "Ваш город, Ваша улица, 1",
  "now": "03.03.2026, 20:30:10",
  "outages": {},
  "sub_type_reason": "GPV2.1",
  "fact_day_key": "1768428000",
  "current_status": {
    "has_power": false,
    "next_off": null,
    "next_on": "00:30"
  }
}
```

## Скрипты

- `npm run start` — запуск entrypoint (`api/power.ts`)
- `npm run typecheck` — проверка TypeScript
- `npm test` — запуск тестов

## Деплой на Vercel

1. Импортируйте репозиторий в Vercel.
2. Оставьте стандартные настройки проекта.
3. Убедитесь, что в репозитории есть `vercel.json` (роутит `/`, `/swagger`, `/redoc`, `/openapi.yaml`).
4. Нажмите `Deploy`.

После деплоя на `https://<your-vercel-app>.vercel.app` будут доступны:

- `/` — лендинг
- `/swagger` — Swagger UI
- `/redoc` — ReDoc
- `/openapi.yaml` — OpenAPI
- `/api/power` — API endpoint

## Примечания по качеству

- Логика времени учитывает таймзону `Europe/Kyiv`
- Добавлены тесты граничных ситуаций около `00:00`
- Добавлен интеграционный тест API
