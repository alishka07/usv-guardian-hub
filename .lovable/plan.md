## Цель
Перевести интерфейс на тему **Ocean Deep** с типографикой **Sora + Manrope**, layout с **постоянным sidebar**, и насыщенным (но не перегруженным) визуалом: глубокие морские градиенты, мягкий glow, glassmorphism-панели, плавные motion-переходы.

## Этап 1. Дизайн-токены и шрифты
- Установить `@fontsource/sora` и `@fontsource/manrope`, импортировать в `src/router.tsx` (или ближайшей точке инициализации).
- Обновить `src/styles.css`:
  - Палитра Ocean Deep (oklch-эквиваленты `#0c2340 / #1a4a6e / #2d8a9e / #5cbdb9`): `--background`, `--panel`, `--card`, `--primary`, `--cyan-accent`, `--accent`, `--ring`, `--border`, charts.
  - Радиус 0.75rem, чуть больше «дышит».
  - Новые токены: `--gradient-ocean`, `--gradient-depth`, `--shadow-glow`, `--shadow-elev`, `--surface-glass` (полупрозрачный + blur).
  - Фон body: многослойный радиальный градиент (тёмный navy → бирюзовый glow по диагонали) + лёгкий шумовой паттерн через CSS.
  - Утилиты: `.glass-panel`, `.glow-cyan`, `.gradient-text`, обновить `.grid-bg` под морскую сетку.
- В `@theme inline` подключить `--font-sans: "Manrope"`, `--font-display: "Sora"`; добавить класс `font-display` в utilities.

## Этап 2. Каркас приложения — постоянный sidebar
- Создать `src/components/app/AppSidebar.tsx` на базе shadcn `Sidebar` (`collapsible="icon"`):
  - Логотип (Waves) + название сверху.
  - Навигация по разделам (Карта / Устройства / Аналитика) — заменяет текущие `Tabs`.
  - Внизу: индикаторы LIVE, онлайн/RTL, локальное время.
- В `src/routes/__root.tsx` обернуть `<Outlet />` в `SidebarProvider` + рендер `<AppSidebar />` слева, шапка с `SidebarTrigger`.
- В `src/routes/index.tsx`:
  - Убрать `Tabs`, оставить состояние `view: "map" | "devices" | "analytics"` синхронизированное с sidebar (через URL hash или context, по простому — простой state, sidebar дергает callback через zustand-free context).
  - Шапку упростить: только заголовок раздела + кнопка `ConnectDeviceDialog`.

## Этап 3. Визуальная переработка ключевых поверхностей
- **MapView**: стеклянная рамка вокруг карты (`glass-panel` + `shadow-elev`), морская сетка (`grid-bg` обновлённый), у маркеров роботов — кольцевой glow `--cyan-accent`, у выбранной пробы — двойная пульсация с мягким blur. Подписи в `font-display`.
- **RobotPanel / RobotHistoryPanel**: переписать на glassmorphism — `backdrop-blur-xl`, `bg-card/70`, `border-cyan-accent/20`, заголовки `Sora`, мягкая разделительная линия с градиентом. Бейджи статусов — pill-форма с тонкими свечениями (success/warning/danger).
- **SampleDialog**: повысить плотность инфо без перегруза — двухколоночный grid, индикатор качества в виде сегментированной шкалы (4 тира) с градиентом, цветные «pill» бейджи показателей.
- **DevicesView / AnalyticsView**: единый стиль карточек (glass + тонкое cyan-кольцо при ховере), графики перекрасить на `--chart-1..5` ocean-палитру.

## Этап 4. Motion и микровзаимодействия
- Добавить `motion/react` (если не установлен) и применить точечно:
  - Фейд-ин панелей робота (slide+blur), 250 ms.
  - Hover-lift карточек устройств.
  - Кнопки tab/sidebar: smooth `bg`/`text` transition 200 ms.
- Без избыточных анимаций на карте (она и так живая).

## Технические детали
```
Палитра (oklch приближения):
  background  oklch(0.18 0.04 235)   #0c2340
  panel       oklch(0.26 0.05 230)   #1a4a6e
  primary     oklch(0.62 0.10 215)   #2d8a9e
  cyan-accent oklch(0.78 0.09 195)   #5cbdb9
  border      oklch(0.32 0.05 225)
```
Шрифты: `font-display` (Sora 500/600/700) — заголовки, бейджи, числа; `font-sans` (Manrope 400/500/600) — основной текст.

## Файлы, которые будут затронуты
- create: `src/components/app/AppSidebar.tsx`
- edit: `src/styles.css`, `src/router.tsx` (импорты шрифтов), `src/routes/__root.tsx`, `src/routes/index.tsx`
- edit (стиль/токены): `MapView.tsx`, `RobotPanel.tsx`, `RobotHistoryPanel.tsx`, `SampleDialog.tsx`, `DevicesView.tsx`, `AnalyticsView.tsx`, `ConnectDeviceDialog.tsx`
- install: `@fontsource/sora`, `@fontsource/manrope`, (опц.) `motion`

## Что НЕ меняется
Бизнес-логика, симуляция, структура данных, обработчики событий, состав полей.
