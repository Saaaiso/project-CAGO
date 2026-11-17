# Схема базы данных

Документ описывает фактическую схему БД MVP. SQL-источник истины — файлы миграций `001`–`016`; после их применения создаются перечисленные ниже таблицы. Для краткой инструкции по доступу сервисов см. [`usage.md`](./usage.md), для ER-модели — [диаграмму БД](../docs/diagrams/database.md).

## Как читать документ

- **Схема** — раздел таблиц PostgreSQL для одной области данных, например `land` или `monitoring`.
- **PK** (primary key) — поле или набор полей, однозначно определяющий строку.
- **FK** (foreign key) — ссылка на строку другой таблицы; БД не даст сослаться на несуществующую запись.
- **UUID** — тип уникального идентификатора. Для основных записей БД может создать его сама.
- **JSON/JSONB** — поле для структурированных данных; `jsonb` PostgreSQL умеет эффективно проверять и индексировать.
- **Мягкое удаление** — запись остаётся в БД, но помечается `is_deleted`; запросы приложения должны её скрывать.
- **Триггер** — правило БД, которое автоматически срабатывает при вставке или изменении строки.

Начните с [`usage.md`](./usage.md), если нужно узнать, какие схемы доступны Backend и Worker. Затем найдите нужную схему и таблицу ниже.

## PostgreSQL и общие правила

- PostgreSQL 16; расширения: PostGIS, `ltree`, `pg_trgm`, `btree_gist`, `citext`.
- Геометрии хранятся в EPSG:4326; участки и пастбища — `geometry(MultiPolygon, 4326)`.
- UUID-поля `id` имеют `DEFAULT gen_random_uuid()` как fallback. Backend может передать собственный UUIDv7; остальные UUID-ссылки значений по умолчанию не имеют.
- Время событий хранится как `timestamptz`; даты сезонов и периодов — `date`/`daterange`.
- Локализованные названия справочников, территорий и организаций хранятся в `jsonb`, например `{"ru":"Пашня","ky":"Айдоо жер"}`.
- `is_deleted` — мягкое удаление там, где поле есть. Backend должен фильтровать удалённые записи по правилам домена.
- Миграции применяются строго по возрастанию номера и только один раз; после применения файл не редактируется. Изменение схемы оформляется новым номером. SQL-файлы являются источником правды; runner (например, DbUp или Flyway) пока не выбран и не настроен. `db/seeds/dev_data.sql` — повторно запускаемые синтетические данные для разработки, не миграция.

## Порядок миграций

| Файл | Что создаёт |
|---|---|
| `001_enable_extensions.sql` | PostGIS и расширения PostgreSQL |
| `002_create_schemas.sql` | Все схемы модулей |
| `003_create_org_tables.sql` | Административные единицы и организации |
| `004_create_reference_tables.sql` | Категории земель, виды прав, культуры, виды скота и типы документов |
| `005_create_iam_tables.sql` | Пользователи, роли и назначения роли на территорию |
| `006_create_land_tables.sql` | Субъекты, участки, версии участков и права |
| `007_create_pasture_tables.sql` | Пастбища, поголовье, годовые планы и строки планов |
| `008_create_crop_tables.sql` | Сезоны и декларации посевов |
| `009_create_monitoring_tables.sql` | Спутниковые сцены, NDVI-наблюдения и первоначальная схема оповещений |
| `010_create_docs_tables.sql` | Метаданные файлов и связь файла с участком |
| `011_create_platform_tables.sql` | Outbox, фоновые задачи и пакеты импорта |
| `012_create_audit_table.sql` | Журнал аудита |
| `013_monitoring_integrity_and_rule_code.sql` | FK мониторинга; удаление таблицы правил, rule codes фиксируются в Backend |
| `014_track_import_creators.sql` | Автор фоновой задачи и пакета импорта |
| `015_database_integrity_defaults.sql` | UUID defaults, уникальность для неудалённых записей, CHECK `rule_code`, триггеры площади и `updated_at`, переименование сезона пастбища |
| `016_application_roles_and_grants.sql` | Групповые роли Backend, Worker и чтения отчётов; минимальные GRANT-ы |

После миграции 016 схема содержит 29 таблиц: `alert_rule` отложена до второй итерации; коды правил для записей `monitoring.alert` ограничены значениями `ndvi_drop`, `overgrazing`, `abandoned`. `db/seeds/dev_data.sql` включает запись в `ref`, поэтому выполняется отдельной привилегированной dev/bootstrap-учётной записью, не `app_rw`.

## Схемы и таблицы

ER-диаграмма показывает таблицы и связи целиком. Ниже назначение каждой таблицы и её важные поля описаны по модулям. UUID-поля `created_by`, `changed_by`, `declared_by`, `approved_by`, `uploaded_by`, `actor_id` пока не имеют FK на `iam.user`; существование и права пользователя проверяет приложение.

### Быстрый список таблиц

| Таблица | Простыми словами |
|---|---|
| `org.admin_unit` | Административная территория в дереве: например, область, район или айыл окмоту. |
| `org.organization` | Учреждение, которое работает в указанной административной территории. |
| `ref.land_category` | Справочник категорий земли. |
| `ref.right_type` | Справочник видов права на участок. |
| `ref.crop` | Справочник культур. |
| `ref.livestock_type` | Виды скота и коэффициент пересчёта поголовья. |
| `ref.doc_type` | Справочник типов документов. |
| `iam.user` | Учётная запись человека, который входит в приложение. |
| `iam.role` | Бизнес-роль пользователя в приложении. |
| `iam.user_role_scope` | Назначение роли пользователю на конкретную территорию. |
| `land.subject` | Человек, организация, община или государство, связанные с земельными правами. |
| `land.parcel` | Текущие данные одного земельного участка. |
| `land.parcel_version` | Снимки прошлых состояний участка. |
| `land.parcel_right` | Право субъекта на участок с долей и сроком действия. |
| `pasture.pasture_unit` | Территория пастбища и её характеристики. |
| `pasture.herd` | Запись о поголовье владельца на указанную дату. |
| `pasture.pasture_plan` | План использования пастбища на год. |
| `pasture.pasture_plan_item` | Период и поголовье в составе плана. |
| `crop.season` | Сельскохозяйственный сезон с годом и датами. |
| `crop.crop_declaration` | Заявленная культура и площадь посева на участке за сезон. |
| `monitoring.satellite_scene` | Сведения о спутниковом снимке и его файле. |
| `monitoring.parcel_observation` | Рассчитанные показатели снимка для участка. |
| `monitoring.alert` | Оповещение о возможной проблеме с участком. |
| `docs.file_object` | Метаданные файла, который хранится в MinIO. |
| `docs.parcel_document` | Связь между участком, файлом и типом документа. |
| `platform.outbox` | События, которые нужно передать другим частям системы. |
| `platform.job` | Состояние фонового задания. |
| `platform.import_batch` | Итоги обработки импортированного файла. |
| `audit.change_log` | Журнал значимых действий и изменений. |

### Пример: из чего состоит запись об участке

1. `land.parcel` хранит текущее состояние участка: его территорию, категорию, контур на карте и статус.
2. `land.parcel.admin_unit_id` указывает, к какой административной территории относится участок; `category_id` ссылается на справочник `ref.land_category`.
3. `geom` — граница участка на карте. Триггер БД рассчитывает по ней `area_ha` в гектарах.
4. `land.parcel_right` связывает участок с `land.subject` — человеком, организацией или другой стороной, у которой есть право. В строке также указаны вид права, доля и период действия.
5. `land.parcel_version` сохраняет прошлые состояния, чтобы можно было восстановить историю изменений.
6. Посевная декларация и спутниковые наблюдения ссылаются на тот же `land.parcel`, поэтому их можно сопоставить с участком.

### `org` — территории и организации

- **`org.admin_unit`** — узел административного дерева: `id`, `parent_id`, `level` (0–4), `code`, локализованное `name`, `path` (`ltree`), граница `geom`, `country_code`, `is_deleted`. Пара `(country_code, code)` уникальна: одинаковые коды допускаются в разных странах. `parent_id` — источник истины; Backend в той же транзакции вычисляет `path` и обновляет пути потомков при переносе узла. Каждый сегмент `path` — `u_` + UUID узла без дефисов, поэтому смена отображаемого `code` не меняет путь. `path` нельзя изменять независимо.
- **`org.organization`** — учреждение: `id`, обязательный `admin_unit_id`, `type`, `name`, `contacts`, `is_deleted`. Тип ограничен значениями `aiyl_okmotu`, `pasture_committee`, `district_office`, `ministry`, `other`.

### `ref` — справочники

- **`ref.land_category`** — `id`, уникальный `code`, локализованное `name`; используется участком.
- **`ref.right_type`** — виды прав, например собственность, аренда или пользование.
- **`ref.crop`** — справочник выращиваемых культур.
- **`ref.livestock_type`** — виды скота и `sheep_unit_factor` для перевода поголовья в условные головы.
- **`ref.doc_type`** — типы документов; на него ссылается `docs.parcel_document.doc_type_id`.

Для всех этих таблиц `id` — `smallint`; справочные значения загружаются начальными данными при развёртывании окружения.

### `iam` — учётные записи и территориальные назначения

- **`iam.user`** — одна строка на учётную запись. `id`; `organization_id` (необязательно); уникальный `login` (`citext`, без различия регистра); `email`, `phone`, `full_name`; `password_hash` (только хеш, может быть `NULL` для OIDC-входа); уникальный `external_subject` (OIDC `sub`, необязателен); `locale`; `is_active`; `last_login_at`; `created_at`.
- **`iam.role`** — одна строка на роль. `id`, уникальный машинный `code` и локализованное `name` в JSON.
- **`iam.user_role_scope`** — одна строка назначает пользователю роль на административном узле: `user_id`, `role_id`, `admin_unit_id`. Все три поля входят в PK, поэтому дубликат назначения невозможен, а территория обязательна.

В MVP нет таблиц `iam.permission` и `iam.role_permission`: Backend хранит матрицу «код роли → разрешённые действия», например `aiyl_specialist` → `parcel.read`. Для каждой операции Backend проверяет разрешение и территориальный scope. `admin_unit_id` обязателен; для доступа на всю страну системную роль назначают на корневой `admin_unit`, а политика Backend распространяет scope на дочерние узлы. Запрос от браузера сам по себе не задаёт scope пользователя.

### `land` — земельный реестр

- **`land.subject`** — лицо, организация, община или государство: `id`, `type`, `full_name`, `tax_id`, `doc_number`, `contacts`, `is_deleted`. Поиск по имени ускорен `pg_trgm`; `tax_id` может быть `NULL`, непустые значения уникальны среди неудалённых записей.
- **`land.parcel`** — текущее состояние участка: `id`, `cadastral_number`, `admin_unit_id`, `category_id`, `geom`, `area_ha`, `status`, `attrs`, `valid_from`, `version`, `is_deleted`, `created_by`, `created_at`, `updated_at`. Геометрия проверяется `ST_IsValid`; кадастровый номер уникален среди неудалённых участков, если задан.
- **`land.parcel_version`** — история: `parcel_id`, `version`, `valid_from`, `valid_to`, `geom`, полный `snapshot` JSON, `changed_by`; составной PK `(parcel_id, version)`.
- **`land.parcel_right`** — право на участок: `id`, `parcel_id`, `subject_id`, `right_type_id`, доля `share`, `period`, `doc_ref`. GiST exclusion constraint запрещает пересекающиеся периоды для одной комбинации участка, субъекта и типа права.

`area_ha` для `land.parcel` вычисляет триггер БД из `geom` через `ST_Area(geom::geography) / 10000`, с округлением до четырёх знаков. Он пересчитывает площадь при вставке и изменении геометрии или самой площади; клиентское значение площади не является источником истины. `updated_at` обновляется общим триггером БД. Backend по-прежнему создаёт `parcel_version` и управляет `version` в одной транзакции.

Сумма долей `share` в `land.parcel_right` проверяется Backend транзакционно: блокируется участок, затем проверяется сумма действующих на дату прав. Прямую запись Worker в `land.parcel_right` запрещают GRANT-ы миграции 016. Для обнаружения обходных/ручных изменений ночная задача должна проверять участки, у которых сумма долей активных на текущую дату прав превышает 1. Exclusion constraint запрещает пересекающиеся периоды для той же комбинации участка, субъекта и типа права, но сам по себе не ограничивает сумму долей между разными субъектами.

### `pasture` — пастбищное хозяйство

- **`pasture.pasture_unit`** — пастбищная территория: `id`, необязательный `parcel_id`, `admin_unit_id`, `committee_org_id`, `name`, `use_season`, `area_ha`, `carrying_capacity_su`, `geom`, `is_deleted`. Геометрия и площадь относятся к самому пастбищу, не копируются из участка; площадь вычисляется триггером по `geom` через `ST_Area(geom::geography) / 10000`. `admin_unit_id` задаёт территорию учёта. Если `parcel_id` указан, Backend проверяет соответствие участка и территории.
- **`pasture.herd`** — поголовье: `id`, `owner_subject_id`, `livestock_type_id`, `head_count`, `as_of`.
- **`pasture.pasture_plan`** — годовой план: `id`, `pasture_unit_id`, `year`, `status`, `approved_by`, `approved_at`; одна запись на пастбище и год. Статусы `draft`, `approved`, `closed`.
- **`pasture.pasture_plan_item`** — строка плана: `id`, `plan_id`, `herd_id`, `period`, `head_count`; удаляется каскадно при удалении плана.

`pasture.pasture_unit.use_season` — сезон использования пастбища (`winter`, `spring`, `summer`, `autumn`, `all_year`). Имя изменено миграцией 015, поэтому Backend должен использовать `use_season` в ORM-маппинге и запросах. Это не то же самое, что `crop.season`, который описывает год и период сельскохозяйственной кампании посевов; модели намеренно разделены.

### `crop` — посевы

- **`crop.season`** — `id`, `year`, `code`, `period`; пара `(year, code)` уникальна.
- **`crop.crop_declaration`** — `id`, `parcel_id`, `season_id`, `crop_id`, `area_ha`, `sowing_date`, `harvest_date`, `yield_t_ha`, `declared_by`. Комбинация участка, сезона и культуры уникальна. `area_ha` заявляет фермер; триггер отклоняет площадь больше площади участка и проверяет, что уменьшение геометрии участка не сделает уже сохранённую декларацию недопустимой.

### `monitoring` — спутниковые данные и оповещения

- **`monitoring.satellite_scene`** — `id`, `provider`, внешний `external_id`, `acquired_at`, `cloud_cover`, `footprint`, `cog_object_key`, `status`; `(provider, external_id)` уникальна.
- **`monitoring.parcel_observation`** — `parcel_id`, `observed_on`, `scene_id`, `ndvi_mean`, `ndvi_min`, `ndvi_max`, `ndvi_std`, `valid_pixel_share`; PK `(parcel_id, observed_on, scene_id)`, FK на `land.parcel` и `monitoring.satellite_scene`.
- **`monitoring.alert`** — `id`, `rule_code`, `parcel_id`, `admin_unit_id`, `severity`, `raised_at`, `status`, JSON `payload`; FK на `land.parcel` и `org.admin_unit`. `rule_code` указывает на правило в конфигурации Backend.

Таблицы мониторинга пока обычные, без партиционирования. В MVP используются коды `ndvi_drop`, `overgrazing`, `abandoned`, ограниченные CHECK; правила и их параметры находятся в Backend. Добавление нового кода требует миграции. `alert_rule` и настройка правил из БД отложены до следующей итерации.

### `docs` — документы

- **`docs.file_object`** — `id`, `bucket`, `object_key`, `file_name`, `mime`, `size_bytes`, `sha256`, `scan_status`, `uploaded_by`, `uploaded_at`; пара `(bucket, object_key)` уникальна.
- **`docs.parcel_document`** — `parcel_id`, `file_id`, `doc_type_id`; PK `(parcel_id, file_id)`.

Содержимое файлов находится в объектном хранилище, не в PostgreSQL.

### `platform` — фоновые процессы

- **`platform.outbox`** — `id`, `aggregate`, `aggregate_id`, `type`, JSON `payload`, `created_at`, `published_at`; `published_at IS NULL` означает ожидающую публикацию запись.
- **`platform.job`** — `id`, `type`, `status`, JSON `params`/`result`, `attempts`, `created_by`, `created_at`, `started_at`, `finished_at`.
- **`platform.import_batch`** — `id`, `job_id`, `file_id`, `kind`, `total_rows`, `ok_rows`, `error_rows`, `created_by`, `created_at`.

Статусы задачи: `queued`, `running`, `succeeded`, `failed`, `cancelled`. Обработчики должны быть идемпотентны и безопасны к повторной доставке.

### `audit` — журнал действий

- **`audit.change_log`** — `id`, `at`, `actor_id`, `action`, `entity`, `entity_id`, `admin_unit_id`, JSON `diff`, `ip`.

Таблица не партиционирована в MVP. Backend должен писать аудит значимых изменений, экспортов и доступа к персональным данным. Для `app_rw` запись в аудит ограничена INSERT-only миграцией 016.

## Ограничения целостности

Помимо PK, FK, UNIQUE и индексов, DDL задаёт следующие ограничения:

- `org.admin_unit.level` — от 0 до 4; `(country_code, code)` уникален.
- `org.organization.type` — `aiyl_okmotu`, `pasture_committee`, `district_office`, `ministry`, `other`.
- `ref.livestock_type.sheep_unit_factor` — больше нуля.
- `land.subject.type` — `person`, `legal_entity`, `community`, `state`.
- `land.parcel.geom` должна быть валидной; `area_ha >= 0`; `status` — `active`, `archived`, `disputed`, `draft`; `version > 0`.
- `land.parcel_version.valid_to` отсутствует либо больше `valid_from`.
- `land.parcel_right.share` — больше 0 и не больше 1; периоды одного и того же права не пересекаются.
- `pasture.pasture_unit.use_season` — `winter`, `spring`, `summer`, `autumn`, `all_year`; площадь и вместимость неотрицательны.
- `pasture.herd.head_count` и `pasture.pasture_plan_item.head_count` неотрицательны; `pasture.pasture_plan.status` — `draft`, `approved`, `closed`.
- `crop.crop_declaration.area_ha >= 0`; дата уборки не предшествует дате посева, если обе заданы; площадь не превышает площадь участка (триггер).
- `monitoring.satellite_scene.cloud_cover` — от 0 до 100; статус — `new`, `downloaded`, `processed`, `failed`.
- `monitoring.parcel_observation.valid_pixel_share` — от 0 до 1, если задано.
- `monitoring.alert.rule_code` — `ndvi_drop`, `overgrazing`, `abandoned`; `severity` — `info`, `warning`, `critical`; `status` — `open`, `ack`, `resolved`.
- `docs.file_object.size_bytes >= 0`; `scan_status` — `pending`, `clean`, `infected`.
- `platform.job.attempts >= 0`; статус — `queued`, `running`, `succeeded`, `failed`, `cancelled`. Счётчики строк импорта неотрицательны, если заданы.

## Роли PostgreSQL и права

Миграция 016 создаёт три NOLOGIN-роли-группы с правами, но не создаёт пользовательские логины и не задаёт пароли. В каждом окружении существующий LOGIN подключается к нужной группе через `GRANT`; пароли остаются в настройках PostgreSQL/секретах окружения. Роли-группы не являются суперпользователями, не могут создавать БД/роли и не обходят RLS.

| Роль | Права |
|---|---|
| `app_rw` | CRUD для `org`, `iam`, `land`, `pasture`, `crop`, `monitoring`, `docs`, `platform`; только чтение `ref`; только INSERT в `audit` |
| `worker_rw` | SELECT в `land`; SELECT/INSERT/UPDATE в `monitoring`, `platform`; нет прав записи в `land` и доступа к `iam` |
| `report_ro` | Только SELECT в `org`, `ref`, `land`, `pasture`, `crop`, `monitoring`; нет доступа к `iam`, документам и аудиту |

Для текущего окружения Backend и Worker подключаются к своим LOGIN-ролям, которым выданы соответственно `app_rw` и `worker_rw`; `dba_admin` используется только для администрирования/миграций. `report_ro` можно назначить отдельной LOGIN-роли аналитика, если ей нужен прямой доступ к БД. RLS-политики этими миграциями не создаются. Права на новые таблицы, добавленные следующими миграциями, необходимо выдавать отдельно. Миграции должен запускать отдельный привилегированный deploy-шаг; Backend и Worker подключаются только после подготовки схемы.

## Периодические проверки данных

Для MVP Backend/планировщик должен создавать задачи в `platform.job` и сохранять найденные расхождения в `result`/логах. Рекомендуемые типы задач: `integrity.parcel_right_share_check` и `integrity.admin_unit_path_check`.

Проверка суммы долей действующих на текущую дату прав:

```sql
SELECT parcel_id, sum(share) AS total_share
FROM land.parcel_right
WHERE period @> current_date
GROUP BY parcel_id
HAVING sum(share) > 1;
```

Проверка `org.admin_unit.path` относительно цепочки `parent_id`:

```sql
WITH RECURSIVE tree AS (
    SELECT id, parent_id,
           ('u_' || replace(id::text, '-', ''))::ltree AS expected_path
    FROM org.admin_unit
    WHERE parent_id IS NULL

    UNION ALL

    SELECT child.id, child.parent_id,
           tree.expected_path
             || ('u_' || replace(child.id::text, '-', ''))::ltree
    FROM org.admin_unit AS child
    JOIN tree ON child.parent_id = tree.id
)
SELECT unit.id, unit.path, tree.expected_path
FROM org.admin_unit AS unit
LEFT JOIN tree ON tree.id = unit.id
WHERE tree.id IS NULL
   OR unit.path IS DISTINCT FROM tree.expected_path;
```

## Связи и правила доступа

Основные физические FK: IAM → organization/admin unit; parcel → admin unit/категория; права → parcel/subject/type; посевы → parcel/season/crop; пастбища → территории/участки/субъекты; документы → parcel/file/type; импорт → job/file; мониторинговые наблюдения и оповещения → parcel/admin unit/scene, как показано на ER-диаграммах.

Для просмотра участков Backend должен:

1. убедиться, что `iam.user.is_active = true`;
2. получить назначения пользователя из `iam.user_role_scope`;
3. проверить действие по матрице прав Backend;
4. ограничить выборку `land.parcel.admin_unit_id` назначенным узлом и разрешённым поддеревом;
5. отдавать только запрошенные поля и страницы результатов.

Для Worker применяются GRANT-ы из таблицы выше: он может читать `land`, но не менять земельные записи; запись разрешена только в `monitoring` и `platform`. Контроль доступа на уровне строк (RLS) пока не настроен.

## Важные ограничения текущей реализации

- `created_at`/`updated_at` не добавляются механически во все таблицы: справочники и неизменяемые наблюдения имеют собственные временные поля или не нуждаются в аудите изменения. Для таблиц с `updated_at` дата обновляется триггером.
- Площадь участков и пастбищ вычисляется БД-триггером; `crop_declaration.area_ha` остаётся заявляемым значением и проверяется относительно участка.
- UUID-первичные ключи имеют `DEFAULT gen_random_uuid()`; Backend может передать свой UUIDv7.
- Поля `created_by`, `changed_by`, `declared_by`, `approved_by`, `uploaded_by`, `actor_id` пока не имеют FK на `iam.user`.
- RLS не включён; GRANT-ы и прикладные роли создаются миграцией 016.
- `org.admin_unit.path` вычисляется Backend из `parent_id`; создание и перемещение узла должно обновлять все затронутые пути потомков атомарно.
