# Зорька (Zorka)

Мобильное веб-приложение (PWA) для рыболовов: учёт пойманной рыбы, анализ погоды и мест ловли, дневник и хранение фото улова.

## Статус проекта

🟢 **Фаза 0 завершена.** Архитектура, документация, ADR, дизайн-система и макеты готовы. Следующий шаг — каркас: [план фазы 1](docs/07-phase1-plan.md) (на ревью заказчика).

- [Vision и требования](docs/01-vision.md)
- [Архитектура системы](docs/02-architecture.md)
- [Модель данных](docs/03-data-model.md)
- [Роадмап](docs/04-roadmap.md)
- [Справочник видов рыбы](docs/05-species-catalog.md)
- [Дизайн-система](docs/06-design-system.md)
- [План фазы 1](docs/07-phase1-plan.md)
- [Глоссарий](docs/glossary.md)
- [ADR (журнал архитектурных решений)](docs/adr/)

## Ключевые решения (кратко)

| Область                | Решение                                                                     | ADR                                           |
| ---------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| Форма приложения       | PWA                                                                         | [ADR-0001](docs/adr/0001-pwa.md)              |
| Бэкенд                 | Supabase (Postgres, Auth, Storage)                                          | [ADR-0002](docs/adr/0002-supabase-baas.md)    |
| Фронтенд               | React + Vite + TypeScript (CSS Modules, React Router)                       | [ADR-0003](docs/adr/0003-frontend-stack.md)   |
| Оффлайн                | Частичный оффлайн (outbox)                                                  | [ADR-0004](docs/adr/0004-partial-offline.md)  |
| Карты                  | Яндекс.Карты                                                                | [ADR-0005](docs/adr/0005-yandex-maps.md)      |
| Погода                 | OpenWeatherMap                                                              | [ADR-0006](docs/adr/0006-openweathermap.md)   |
| Фото                   | Облако + thumbnails                                                         | [ADR-0007](docs/adr/0007-photo-storage.md)    |
| Auth                   | Логин+пароль → OAuth                                                        | [ADR-0008](docs/adr/0008-auth.md)             |
| Виды рыбы              | Встроенный справочник                                                       | [ADR-0009](docs/adr/0009-species-catalog.md)  |
| Визуальное направление | Спокойная природная палитра (тил, светлый серо-голубой фон, белые карточки) | [ADR-0010](docs/adr/0010-visual-direction.md) |
| Окружение разработки   | Локальный стек Supabase (CLI + Docker)                                      | [ADR-0011](docs/adr/0011-dev-environment.md)  |

## Аудитория

На первом этапе — автор и друзья (закрытый доступ), далее — публичный продукт с открытой регистрацией.
