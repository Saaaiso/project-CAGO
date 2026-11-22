# Worker — инструкция для участника команды

Привет! Ты отвечаешь за Worker — фоновую обработку заданий CAGO.

## Что уже есть

В репозитории есть схема PostgreSQL с миграциями, Docker Compose для PostgreSQL/PostGIS, Redis и MinIO. Самого Worker-приложения пока нет: папка `workers` ещё пустая.

Общий договор с Backend по заданиям, Redis, PostgreSQL и MinIO описан в [`../docs/backend-worker-contract.md`](../docs/backend-worker-contract.md). Сверяйтесь с ним при реализации и меняйте формат только согласованно.

## Как начать

Склонируй репозиторий. В PowerShell из его корневой папки выполни:

```powershell
Copy-Item .env.example .env
```

Открой `.env`, замени все пароли `change-me-*` на свои уникальные и не отправляй этот файл другим. Запусти инфраструктуру:

```powershell
docker compose up -d --build
docker compose ps
```

PostgreSQL, Redis и MinIO должны быть в состоянии `healthy`. Если сервис не запустился, посмотри его лог, например: `docker compose logs redis`.

## Что использовать Worker

Worker подключается к PostgreSQL с пользователем и паролем из `WORKER_DB_USER` и `WORKER_DB_PASSWORD` — этому пользователю выдана роль `worker_rw`. Для Redis используй пользователя `cago-worker` и пароль `REDIS_WORKER_PASSWORD`. Для MinIO — `MINIO_WORKER_USER` и `MINIO_WORKER_PASSWORD`.

Если Worker запущен прямо на компьютере, адреса: PostgreSQL `localhost:5432`, Redis `localhost:6379`, MinIO `http://localhost:9000`. Имя базы — `POSTGRES_DB`, bucket MinIO — `cago-docs`. Не используй учётные данные Backend или административные пароли. Права Worker на PostgreSQL описаны в `db/usage.md`.

Worker читает `platform.job.params`, обрабатывает сообщение из Redis Stream `cago:jobs`, сохраняет статус и результат в PostgreSQL, а затем подтверждает сообщение в Redis. Формат сообщения, статусы и правила для файлов описаны в договоре выше.

## Проверка

Сейчас Compose запускает только инфраструктуру, не Worker. Поэтому проверить обработку заданий или запустить тесты Worker пока нельзя. Проверить состояние сервисов можно командой `docker compose ps`; после появления кода Worker добавь сюда команды его запуска и тестирования.
