# Project Power API

API для получения информации о плановых и фактических отключениях электроэнергии от DTEK по адресу.

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

## Деплой лендинга (GitHub + Cloudflare Pages)

См. пошаговую инструкцию: [docs/cloudflare-pages.md](docs/cloudflare-pages.md)

Коротко:

- Подключаете репозиторий в Cloudflare Pages
- `Framework preset`: `None`
- `Build output directory`: `site`
- `Build command`: пусто

## Примечания по качеству

- Логика времени учитывает таймзону `Europe/Kyiv`
- Добавлены тесты граничных ситуаций около `00:00`
- Добавлен интеграционный тест API
