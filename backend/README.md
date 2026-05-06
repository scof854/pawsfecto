# Pawfecto Backend

API для приёма заявок с сайта, сохранения в PostgreSQL и отправки уведомления в Telegram.

**Стек:** NestJS 10 · TypeScript · PostgreSQL · Prisma · Telegram Bot API · Vercel Serverless Functions.

## Что делает backend

```text
POST /api/leads
  -> валидация DTO + rate limit + honeypot
  -> сохранение заявки в PostgreSQL
  -> отправка сообщения в Telegram
  -> обновление статуса SENT или FAILED
```

Backend больше не требует Redis/BullMQ и подходит для Vercel: нет очередей, воркеров и долгоживущих процессов.

## Структура

```text
backend/
├── api/[...path].ts            # serverless entrypoint для Vercel
├── prisma/schema.prisma        # модель Lead
├── src/
│   ├── bootstrap.ts            # общая настройка Nest-приложения
│   ├── main.ts                 # локальный HTTP-сервер
│   ├── app.module.ts
│   ├── health/health.controller.ts
│   ├── leads/
│   │   ├── dto/create-lead.dto.ts
│   │   ├── leads.controller.ts
│   │   ├── leads.module.ts
│   │   └── leads.service.ts
│   ├── prisma/
│   └── telegram/
├── .env.example
├── package.json
└── vercel.json
```

## ENV-переменные

Минимально нужны:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
TELEGRAM_BOT_TOKEN=123456789:AA-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TELEGRAM_CHAT_ID=-1001234567890
CORS_ORIGIN=https://your-site.vercel.app
```

Опционально:

```env
PORT=3000
TELEGRAM_WEBHOOK_SECRET=change-me-to-a-long-random-string
TELEGRAM_WEBHOOK_URL=https://your-backend.vercel.app/api/telegram/webhook
```

## Локальный запуск

Из папки `backend`:

```bash
cp .env.example .env
npm install
npx prisma db push
npm run start:dev
```

Проверка health endpoint:

```bash
curl http://localhost:3000/api/health
```

Тестовая заявка:

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"+375291234567","message":"Хочу записаться","source":"local-test"}'
```

## Деплой на Vercel

1. Создать PostgreSQL базу: Vercel Postgres, Neon, Supabase или другой managed PostgreSQL.
2. В Vercel импортировать проект и выбрать папку `backend` как root directory.
3. Добавить Environment Variables:
   - `DATABASE_URL`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `CORS_ORIGIN`
   - при необходимости `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_WEBHOOK_URL`
4. Перед первым деплоем применить Prisma schema к базе:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npx prisma db push
```

5. Задеплоить через Vercel UI или CLI:

```bash
vercel --prod
```

После деплоя проверить:

```bash
curl https://your-backend.vercel.app/api/health
```

## API

### `POST /api/leads`

Тело запроса:

```json
{
  "name": "Айгерим",
  "phone": "+375 (44) 518-25-14",
  "email": "client@example.com",
  "message": "Хочу записать шпица на стрижку",
  "source": "landing-form",
  "website": ""
}
```

Поле `website` — honeypot. У реального пользователя оно должно быть пустым.

Ответ:

```json
{
  "id": "uuid",
  "status": "SENT",
  "createdAt": "2026-05-06T...Z"
}
```

Если Telegram временно недоступен, заявка всё равно сохраняется, а статус станет `FAILED` с ошибкой в `lastError`.

### `GET /api/leads/:id`

Получить заявку по UUID.

### `GET /api/health`

Проверка работоспособности API.
