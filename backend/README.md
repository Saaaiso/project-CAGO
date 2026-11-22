# Backend — инструкция для участника команды

Привет! Ты отвечаешь за Backend — серверную часть CAGO.

## Что уже есть

В репозитории есть схема PostgreSQL и миграции, API-контракт в `docs/openapi.yaml` и Docker Compose для PostgreSQL/PostGIS, Redis и MinIO. Самого Backend-приложения пока нет: папка `backend` ещё пустая.

## Как начать

Склонируй репозиторий. В PowerShell из его корневой папки выполни:

```powershell
Copy-Item .env.example .env
```

Открой `.env` и замени все пароли `change-me-*` на свои уникальные. Не отправляй `.env` другим и не добавляй его в Git. Затем запусти базы и хранилище:

```powershell
docker compose up -d --build
docker compose ps
```

PostgreSQL, Redis и MinIO должны быть в состоянии `healthy`. Если сервис не запустился, посмотри его лог, например: `docker compose logs postgres`.

## Что использовать Backend

Backend подключается к PostgreSQL с пользователем и паролем из `APP_DB_USER` и `APP_DB_PASSWORD` — этому пользователю выдана роль `app_rw`. Для Redis используй пользователя `cago-backend` и пароль `REDIS_BACKEND_PASSWORD`. Для MinIO — `MINIO_BACKEND_USER` и `MINIO_BACKEND_PASSWORD`.

Если запускаешь Backend прямо на компьютере, адреса сервисов: PostgreSQL `localhost:5432`, Redis `localhost:6379`, MinIO `http://localhost:9000`. Имя базы — значение `POSTGRES_DB`, bucket MinIO — `cago-docs`. Не используй административные пароли и учётные записи Worker.

## Проверка

Сейчас Compose запускает только инфраструктуру, не Backend. Поэтому проверить API или запустить тесты Backend пока нельзя. Проверить состояние баз можно командой `docker compose ps`; после появления кода Backend добавь сюда команды его запуска и тестирования.
