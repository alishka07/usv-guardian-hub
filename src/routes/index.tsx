import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AquaWatch — мониторинг качества воды Казахстана" },
      {
        name: "description",
        content:
          "AquaWatch: автономные USV-аппараты измеряют качество воды круглосуточно, ИИ определяет источник загрязнения за секунды.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Manrope:wght@300;400;500;600&display=swap",
      },
    ],
  }),
});

const NAVY = "#0A1A3F";
const display = { fontFamily: "'Sora', sans-serif" };
const sans = { fontFamily: "'Manrope', sans-serif" };

function Landing() {
  return (
    <div className="w-full bg-white text-[#0A1A3F] min-h-screen" style={sans}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#0A1A3F]/8">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to="/" className="font-semibold text-base tracking-tight" style={display}>
            AquaWatch
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#0A1A3F]/70">
            <a href="#how" className="hover:text-[#0A1A3F] transition-colors">Как работает</a>
            <a href="#tiers" className="hover:text-[#0A1A3F] transition-colors">Тарифы</a>
            <a href="#contact" className="hover:text-[#0A1A3F] transition-colors">Контакты</a>
          </div>
          <Link
            to="/app"
            className="px-5 py-2 bg-[#0A1A3F] text-white text-sm font-medium rounded-full hover:bg-[#16348F] transition-colors"
          >
            Платформа
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 lg:px-10 pt-24 lg:pt-36 pb-24 lg:pb-32">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0A1A3F]/50 mb-8">
            Мониторинг воды · Казахстан
          </div>
          <h1
            className="text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight mb-10"
            style={display}
          >
            Чистая вода —<br />
            <span className="text-[#0A1A3F]/40">измеримая величина.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#0A1A3F]/65 max-w-xl leading-relaxed mb-12">
            Автономные USV-аппараты круглосуточно собирают данные о качестве воды,
            а ИИ определяет источник загрязнения за секунды.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/app"
              className="px-7 py-3.5 bg-[#0A1A3F] text-white text-sm font-medium rounded-full hover:bg-[#16348F] transition-colors"
            >
              Открыть платформу
            </Link>
            <a
              href="#how"
              className="px-7 py-3.5 border border-[#0A1A3F]/15 text-sm font-medium rounded-full hover:border-[#0A1A3F]/40 transition-colors"
            >
              Как это работает
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-[#0A1A3F]/8">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
          {[
            { v: "85%", l: "водоёмов без постоянного мониторинга" },
            { v: "24/7", l: "непрерывных измерений" },
            { v: "5", l: "типов источников загрязнения" },
            { v: "<30с", l: "до классификации аномалии" },
          ].map((s) => (
            <div key={s.v}>
              <div className="text-4xl md:text-5xl font-semibold tracking-tight" style={display}>
                {s.v}
              </div>
              <p className="text-xs text-[#0A1A3F]/55 mt-2 leading-snug max-w-[14rem]">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="max-w-6xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="text-xs uppercase tracking-[0.22em] text-[#0A1A3F]/50 mb-5">
          Архитектура
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-16 max-w-2xl leading-[1.1]" style={display}>
          Четыре слоя — от датчика до отчёта.
        </h2>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
          {[
            { n: "01", t: "Сбор данных на USV", b: "ESP32 на MicroPython измеряет показатели в водоёме и проводит первичную проверку порогов." },
            { n: "02", t: "Серверный анализ", b: "pandas и NumPy сверяют показания с нормативами, выявляют аномалии и градиенты." },
            { n: "03", t: "ИИ-классификация", b: "Claude сверяет сигнатуру загрязнения с библиотекой источников и накладывает данные на карту." },
            { n: "04", t: "Готовые отчёты", b: "Автоматические отчёты для госорганов, корпоративных клиентов и публичных дашбордов." },
          ].map((s) => (
            <div key={s.n} className="flex gap-6 border-t border-[#0A1A3F]/8 pt-6">
              <span className="text-sm font-medium text-[#0A1A3F]/40 tabular-nums" style={display}>
                {s.n}
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2" style={display}>{s.t}</h3>
                <p className="text-sm text-[#0A1A3F]/65 leading-relaxed">{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" className="border-t border-[#0A1A3F]/8">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0A1A3F]/50 mb-5">
            Тарифы
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-16 max-w-2xl leading-[1.1]" style={display}>
            Решение под каждый масштаб.
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-[#0A1A3F]/10 border border-[#0A1A3F]/10 rounded-2xl overflow-hidden">
            {[
              { tag: "Series A", n: "Eco", who: "Школы, НКО, исследователи", items: ["1 USV с базовыми датчиками", "Веб-дашборд и телеметрия", "Экспорт данных", "Сообщество"] },
              { tag: "Series B", n: "Pro", who: "Водоканалы, промышленность", items: ["Парк USV с градиентным анализом", "ИИ-классификация источников", "Оповещения о превышениях", "Регуляторная отчётность"], featured: true },
              { tag: "Series C", n: "Gov", who: "Казгидромет, Министерство экологии", items: ["Национальная сеть мониторинга", "Интеграция с ГИС", "Публичные дашборды", "SLA и сопровождение"] },
            ].map((t) => (
              <div
                key={t.n}
                className={`p-10 flex flex-col ${t.featured ? "bg-[#0A1A3F] text-white" : "bg-white"}`}
              >
                <div className={`text-[10px] uppercase tracking-widest mb-3 ${t.featured ? "text-white/55" : "text-[#0A1A3F]/45"}`}>
                  {t.tag}
                </div>
                <h3 className="text-3xl font-semibold mb-2" style={display}>{t.n}</h3>
                <p className={`text-sm mb-8 ${t.featured ? "text-white/65" : "text-[#0A1A3F]/55"}`}>
                  {t.who}
                </p>
                <ul className={`space-y-2.5 text-sm flex-1 mb-10 ${t.featured ? "text-white/85" : "text-[#0A1A3F]/75"}`}>
                  {t.items.map((i) => <li key={i}>· {i}</li>)}
                </ul>
                <Link
                  to="/app"
                  className={`block text-center py-3 text-sm font-medium rounded-full transition-colors ${
                    t.featured
                      ? "bg-white text-[#0A1A3F] hover:bg-white/90"
                      : "border border-[#0A1A3F]/15 hover:border-[#0A1A3F]/40"
                  }`}
                >
                  Выбрать
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="border-t border-[#0A1A3F]/8">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 leading-[1.1] max-w-2xl mx-auto" style={display}>
            Сделаем воду прозрачной — в данных и на деле.
          </h2>
          <p className="text-base md:text-lg text-[#0A1A3F]/60 mb-10 max-w-xl mx-auto">
            Покажем работу AquaWatch на вашем водоёме. Демо и пилот доступны для НКО,
            предприятий и госструктур.
          </p>
          <Link
            to="/app"
            className="inline-flex px-8 py-3.5 bg-[#0A1A3F] text-white text-sm font-medium rounded-full hover:bg-[#16348F] transition-colors"
          >
            Войти в платформу
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#0A1A3F]/8">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#0A1A3F]/55">
          <span style={{ color: NAVY }} className="font-medium text-sm" >AquaWatch</span>
          <span>© 2026 · Астанинское водохранилище · Казахстан</span>
          <a href="mailto:hello@aquawatch.kz" className="hover:text-[#0A1A3F]">hello@aquawatch.kz</a>
        </div>
      </footer>
    </div>
  );
}