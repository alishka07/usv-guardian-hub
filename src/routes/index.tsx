import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "AquaWatch — мониторинг качества воды Казахстана" },
      {
        name: "description",
        content:
          "AquaWatch: автономные USV-аппараты круглосуточно измеряют качество воды, ИИ определяет источник загрязнения за секунды.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
});

const display = { fontFamily: "'Bricolage Grotesque', sans-serif" };
const sans = { fontFamily: "'Hanken Grotesk', sans-serif" };

function Landing() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY > 40;
      navRef.current?.classList.toggle("nav-scrolled", scrolled);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="w-full bg-[#0A1A3F] text-white overflow-hidden" style={sans}>
      <style>{`
        .nav-scrolled { background: rgba(10,26,63,0.85); backdrop-filter: saturate(140%) blur(14px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        @keyframes floaty { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-10px) rotate(var(--r,0deg)); } }
        .floaty { animation: floaty 6s ease-in-out infinite; }
        @keyframes ringpulse { 0% { transform: scale(0.85); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
        .ringpulse { animation: ringpulse 3s ease-out infinite; }
      `}</style>

      {/* NAV */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#74D426] shadow-[0_0_12px_#74D426]" />
          <span className="font-bold text-lg tracking-tight" style={display}>
            AquaWatch
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <a href="#how" className="hover:text-[#34C2A2] transition-colors">
            Как работает
          </a>
          <a href="#tiers" className="hover:text-[#34C2A2] transition-colors">
            Тарифы
          </a>
          <a href="#problem" className="hover:text-[#34C2A2] transition-colors">
            Проблема
          </a>
          <Link
            to="/app"
            className="px-5 py-2.5 bg-[#74D426] text-[#0A1A3F] font-bold rounded-full hover:scale-105 transition-transform"
          >
            Открыть платформу
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 lg:px-24 pt-32 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#16348F] blur-[120px] rounded-full opacity-30" />
          <div className="absolute bottom-[20%] left-[-5%] w-[40%] h-[40%] bg-[#34C2A2] blur-[150px] rounded-full opacity-10" />
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#74D426] shadow-[0_0_12px_#74D426]" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#34C2A2]">
                Сеть мониторинга воды · Казахстан
              </span>
            </div>

            <h1
              className="text-6xl md:text-7xl xl:text-8xl font-extrabold leading-[0.9] tracking-tight mb-8"
              style={display}
            >
              Здоровье <br />
              ваших <br />
              <span className="text-[#34C2A2]">водоёмов</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300/80 mb-10 max-w-lg leading-relaxed">
              Автономные USV-аппараты AquaWatch измеряют качество воды круглосуточно, а ИИ
              определяет источник загрязнения за секунды — от сточных вод до промышленных сбросов.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/app"
                className="px-8 py-4 bg-[#74D426] text-[#0A1A3F] font-bold rounded-full hover:scale-105 transition-transform shadow-[0_10px_40px_-10px_rgba(116,212,38,0.6)]"
              >
                Запустить AquaWatch →
              </Link>
              <a
                href="#how"
                className="px-8 py-4 border border-white/20 rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                Как это работает
              </a>
            </div>
          </div>

          {/* Visual */}
          <div className="relative flex items-center justify-center min-h-[520px]">
            {/* glow + rings */}
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-[#34C2A2] to-[#16348F] shadow-[0_0_80px_rgba(52,194,162,0.35)]" />
            <div className="absolute w-56 h-56 rounded-full border border-white/15 ringpulse" />
            <div className="absolute w-56 h-56 rounded-full border border-[#34C2A2]/30 ringpulse" style={{ animationDelay: "1.2s" }} />

            {/* Buoy SVG */}
            <svg viewBox="0 0 200 280" className="relative z-10 w-56 h-72 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <rect x="94" y="10" width="12" height="90" rx="6" fill="#74D426" />
              <circle cx="100" cy="14" r="11" fill="#74D426" />
              <circle cx="100" cy="14" r="5" fill="#0A1A3F" />
              <rect x="60" y="62" width="80" height="26" rx="4" fill="#16348F" transform="rotate(-8 100 75)" />
              <line x1="80" y1="60" x2="74" y2="92" stroke="#4A8FF0" strokeWidth="1.5" transform="rotate(-8 100 75)" />
              <line x1="100" y1="58" x2="100" y2="92" stroke="#4A8FF0" strokeWidth="1.5" transform="rotate(-8 100 75)" />
              <line x1="120" y1="60" x2="126" y2="92" stroke="#4A8FF0" strokeWidth="1.5" transform="rotate(-8 100 75)" />
              <ellipse cx="100" cy="210" rx="62" ry="54" fill="#29A98D" />
              <ellipse cx="100" cy="195" rx="62" ry="40" fill="#34C2A2" />
              <rect x="38" y="150" width="124" height="50" fill="#29A98D" />
              <ellipse cx="100" cy="150" rx="62" ry="26" fill="#3FD4B0" />
              <ellipse cx="100" cy="150" rx="44" ry="17" fill="#16348F" />
              <path d="M40 178 h120 v10 h-120 z" fill="#74D426" />
              <rect x="96" y="240" width="8" height="34" rx="4" fill="#16348F" />
              <circle cx="100" cy="276" r="6" fill="#4A8FF0" />
            </svg>

            {/* Floating data cards */}
            <div
              className="absolute top-6 right-0 lg:right-[-1rem] p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl floaty"
              style={{ ["--r" as string]: "3deg", transform: "rotate(3deg)" }}
            >
              <div className="text-[10px] uppercase font-bold text-[#34C2A2] mb-1 tracking-wider">
                pH уровень
              </div>
              <div className="text-2xl font-bold" style={display}>
                7.2 <span className="text-xs text-[#74D426] font-medium ml-1">↑ стабильно</span>
              </div>
            </div>

            <div
              className="absolute bottom-8 left-0 lg:left-[-1rem] p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl floaty"
              style={{ ["--r" as string]: "-3deg", transform: "rotate(-3deg)", animationDelay: "1.5s" }}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                Микрочастицы
              </div>
              <div className="text-3xl font-bold mb-2" style={display}>
                512 <span className="text-sm font-normal text-slate-300">ч/м³</span>
              </div>
              <div className="px-2 py-0.5 bg-[#74D426]/20 text-[#74D426] text-[10px] font-bold rounded inline-block tracking-wider">
                НИЗКАЯ КОНЦЕНТРАЦИЯ
              </div>
            </div>

            <div
              className="absolute top-1/2 right-[-2rem] hidden xl:block p-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl floaty"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                O₂ растворённый
              </div>
              <div className="text-xl font-bold" style={display}>
                8.4 <span className="text-xs font-normal text-slate-300">мг/л</span>
              </div>
              <div className="text-[10px] text-white/60 mt-1">USV-3 · оз. Боровое</div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div
          id="problem"
          className="relative z-10 max-w-7xl mx-auto w-full mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-white/5"
        >
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-[#34C2A2]" style={display}>
              85%
            </div>
            <p className="text-xs text-slate-400 leading-snug uppercase tracking-wider">
              поверхностных водоёмов Казахстана не имеют постоянного мониторинга
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold" style={display}>
              24/7
            </div>
            <p className="text-xs text-slate-400 leading-snug uppercase tracking-wider">
              непрерывных измерений вместо редких ручных проб
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold" style={display}>
              5
            </div>
            <p className="text-xs text-slate-400 leading-snug uppercase tracking-wider">
              типов источников загрязнения распознаёт ИИ
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-[#74D426]" style={display}>
              &lt;30с
            </div>
            <p className="text-xs text-slate-400 leading-snug uppercase tracking-wider">
              от обнаружения аномалии до классификации и оповещения
            </p>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section
        id="how"
        className="px-6 lg:px-24 py-24 lg:py-32 bg-white text-[#0A1A3F] rounded-t-[40px] lg:rounded-t-[60px]"
      >
        <div className="max-w-7xl mx-auto">
          <span className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase mb-4 text-[#34C2A2]">
            Архитектура
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-[1.05] tracking-tight" style={display}>
            Четыре слоя — <br />
            от датчика до отчёта
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-16 lg:mb-20 leading-relaxed">
            Данные проходят путь от автономного USV до готового отчёта для государства, клиентов и
            общественности. ИИ подключается только тогда, когда это действительно нужно.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                n: "01",
                tone: "text-[#34C2A2] bg-[#34C2A2]/10",
                title: "Сбор данных на USV",
                body: "ESP32 на MicroPython измеряет показатели прямо в водоёме и проводит первичную проверку пороговых значений — без задержек на связь.",
                chip: "ESP32 · MicroPython",
                dark: false,
              },
              {
                n: "02",
                tone: "text-[#16348F] bg-[#16348F]/10",
                title: "Серверный анализ",
                body: "pandas и NumPy сверяют показания с нормативами, выявляют аномалии и градиенты между соседними станциями.",
                chip: "pandas · NumPy",
                dark: false,
              },
              {
                n: "03",
                tone: "text-[#74D426] bg-[#74D426]/15",
                title: "ИИ-классификация",
                body: "При аномалии Claude сверяет сигнатуру загрязнения с библиотекой источников и накладывает данные на карту через geoportal.kz.",
                chip: "Claude API · GIS",
                dark: false,
              },
              {
                n: "04",
                tone: "bg-[#34C2A2] text-[#0A1A3F]",
                title: "Готовые отчёты",
                body: "Автоматические отчёты для госорганов, корпоративных клиентов и публичных дашбордов — с картой, графиками и выводами.",
                chip: "PDF · Excel · Web",
                dark: true,
              },
            ].map((s) => (
              <div
                key={s.n}
                className={
                  s.dark
                    ? "p-8 rounded-3xl bg-[#0A1A3F] text-white border border-[#0A1A3F] flex flex-col"
                    : "p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex flex-col"
                }
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-6 ${s.tone}`}
                  style={display}
                >
                  {s.n}
                </div>
                <h3 className="text-xl font-bold mb-3" style={display}>
                  {s.title}
                </h3>
                <p className={`text-sm leading-relaxed flex-1 ${s.dark ? "text-slate-300" : "text-slate-500"}`}>
                  {s.body}
                </p>
                <span
                  className={`mt-6 inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full self-start ${
                    s.dark ? "bg-white/10 text-[#74D426]" : "bg-white text-slate-500 border border-slate-100"
                  }`}
                >
                  {s.chip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" className="px-6 lg:px-24 py-24 lg:py-32 bg-slate-50 text-[#0A1A3F]">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase mb-4 text-[#34C2A2]">
            Тарифы
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-[1.05] tracking-tight" style={display}>
            Решение под каждый масштаб
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-16 leading-relaxed">
            От одной школы до национальной сети мониторинга — три линейки оборудования и сервиса.
          </p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Eco */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Series A
              </div>
              <h3 className="text-3xl font-bold mb-2" style={display}>
                Eco
              </h3>
              <p className="text-sm text-slate-500 mb-8">
                Школы, экологические НКО, исследователи
              </p>
              <ul className="space-y-3 text-sm text-slate-600 mb-10 flex-1">
                <li>• 1 USV-аппарат с базовым набором датчиков</li>
                <li>• Веб-дашборд с картой и телеметрией в реальном времени</li>
                <li>• Образовательные отчёты и экспорт данных</li>
                <li>• Сообщество и поддержка</li>
              </ul>
              <Link
                to="/app"
                className="block text-center py-3.5 border-2 border-slate-100 rounded-full font-bold hover:bg-slate-50 transition-colors"
              >
                Выбрать
              </Link>
            </div>

            {/* Pro (featured) */}
            <div className="p-10 rounded-3xl bg-[#0A1A3F] text-white border border-[#34C2A2]/30 relative overflow-hidden flex flex-col shadow-[0_30px_60px_-20px_rgba(10,26,63,0.4)]">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#34C2A2] text-[#0A1A3F] text-[10px] font-bold uppercase tracking-wider rounded-bl-2xl">
                Хит
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#34C2A2] mb-3">
                Series B
              </div>
              <h3 className="text-3xl font-bold mb-2" style={display}>
                Pro
              </h3>
              <p className="text-sm text-slate-300 mb-8">
                Водоканалы, горнодобыча, промышленность
              </p>
              <ul className="space-y-3 text-sm text-slate-200 mb-10 flex-1">
                <li>• Парк USV с градиентным анализом между станциями</li>
                <li>• ИИ-классификация источников загрязнения</li>
                <li>• Оповещения о превышении нормативов</li>
                <li>• Отчётность по требованиям регуляторов</li>
                <li>• Гарантийное и постгарантийное обслуживание</li>
              </ul>
              <Link
                to="/app"
                className="block text-center py-3.5 bg-[#74D426] text-[#0A1A3F] rounded-full font-bold hover:scale-[1.02] transition-transform shadow-[0_10px_30px_-10px_rgba(116,212,38,0.6)]"
              >
                Выбрать Pro
              </Link>
            </div>

            {/* Gov */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Series C
              </div>
              <h3 className="text-3xl font-bold mb-2" style={display}>
                Gov
              </h3>
              <p className="text-sm text-slate-500 mb-8">
                Казгидромет, Министерство экологии
              </p>
              <ul className="space-y-3 text-sm text-slate-600 mb-10 flex-1">
                <li>• Национальная сеть мониторинга водоёмов</li>
                <li>• Интеграция с государственными ГИС-системами</li>
                <li>• Публичные дашборды для граждан</li>
                <li>• Расширенная аналитика и прогнозирование</li>
                <li>• Индивидуальные SLA и сопровождение</li>
              </ul>
              <Link
                to="/app"
                className="block text-center py-3.5 border-2 border-slate-100 rounded-full font-bold hover:bg-slate-50 transition-colors"
              >
                Связаться
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-6 lg:px-24 py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-[#0A1A3F] rounded-[32px] lg:rounded-[40px] p-12 md:p-24 overflow-hidden text-center border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-[#16348F] via-transparent to-[#34C2A2]/30 opacity-50" />
            <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#34C2A2] blur-[140px] rounded-full opacity-15 pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-[1.05] tracking-tight"
                style={display}
              >
                Сделаем воду прозрачной —<br />в данных и на деле
              </h2>
              <p className="text-lg text-slate-300 mb-10">
                Покажем работу AquaWatch на вашем водоёме. Демо и пилот доступны для НКО,
                предприятий и госструктур.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#74D426] text-[#0A1A3F] font-bold rounded-full hover:shadow-[0_0_40px_rgba(116,212,38,0.5)] transition-all"
              >
                Войти в платформу →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 lg:px-24 py-16 bg-[#06122E] text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#74D426] shadow-[0_0_12px_#74D426]" />
              <span className="font-bold text-lg" style={display}>
                AquaWatch
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Сеть автономных USV-аппаратов для мониторинга качества воды Казахстана.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#34C2A2] mb-4">
              Продукт
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="#how" className="hover:text-[#74D426] transition-colors">
                  Как работает
                </a>
              </li>
              <li>
                <a href="#tiers" className="hover:text-[#74D426] transition-colors">
                  Тарифы
                </a>
              </li>
              <li>
                <Link to="/app" className="hover:text-[#74D426] transition-colors">
                  Платформа
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#34C2A2] mb-4">
              Компания
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="#problem" className="hover:text-[#74D426] transition-colors">
                  Проблема
                </a>
              </li>
              <li>
                <a href="#cta" className="hover:text-[#74D426] transition-colors">
                  Связаться
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-[#74D426] transition-colors">
                  Технология
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#34C2A2] mb-4">
              Связь
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="mailto:hello@aquawatch.kz" className="hover:text-[#74D426] transition-colors">
                  hello@aquawatch.kz
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[#74D426] transition-colors">
                  Telegram
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[#74D426] transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-xs text-slate-500">
          <span>© 2026 AquaWatch · Капшагайское водохранилище · Казахстан</span>
          <span>Сделано с заботой о воде</span>
        </div>
      </footer>
    </div>
  );
}