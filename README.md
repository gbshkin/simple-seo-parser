# SEO Parser

Небольшая standalone-утилита для сбора `title` и `description` с любого списка страниц.


## Как использовать

1. Заполнить файл `input-urls.json`
2. Запустить:

```bash
npm run parse
```

3. Забрать результат из:

```bash
output-seo.json
```

## Формат input-urls.json

```json
[
  {
    "id": "addresses",
    "url": "https://example.com/page"
  }
]
```

`id` — любая удобная метка, чтобы потом понять, к какой странице относятся данные.

## Что делает

- скачивает HTML страницы
- достает `<title>`
- достает `<meta name="description">`
- сохраняет результат в JSON
- отдельно пишет ошибки и пропуски


`output-seo.json` в репозиторий лучше не коммитить, он уже добавлен в `.gitignore`.
