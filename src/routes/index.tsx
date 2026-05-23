import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import "../landing.css";

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
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

const Star = ({ style, color }: { style: React.CSSProperties; color?: string }) => (
  <svg
    className="star"
    style={color ? { ...style, color } : style}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0l2.4 7.6L22 6l-5.2 5.6L22 18l-7.6-1.6L12 24l-2.4-7.6L2 18l5.2-6.4L2 6l7.6 1.6z" />
  </svg>
);

const Wave = ({ fill }: { fill: string }) => (
  <svg className="wave-divider" viewBox="0 0 1200 80" preserveAspectRatio="none">
    <path d="M0,40 C200,80 400,0 600,30 C800,60 1000,10 1200,40 L1200,80 L0,80 Z" fill={fill} />
  </svg>
);

// Lucide-style icons (inline, stroke-based) ---
const IconWifi = (cls: string) => (
  <svg
    className={cls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);
const IconActivity = (cls: string) => (
  <svg
    className={cls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconSparkles = (cls: string) => (
  <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);
const IconFile = (cls: string) => (
  <svg
    className={cls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconLeaf = (cls: string) => (
  <svg
    className={cls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
);
const IconZap = (cls: string) => (
  <svg
    className={cls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconBuilding = (cls: string) => (
  <svg
    className={cls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M12 6h.01M16 6h.01" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" />
    <path d="M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);

function Landing() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      navRef.current?.classList.toggle("aw-scrolled", window.scrollY > 40);
    };
    const onMouse = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      document.querySelectorAll<HTMLElement>(".aw-landing .hero .star").forEach((s, i) => {
        const k = 20 + i * 14;
        s.style.transform = `translate(${x * k}px, ${y * k}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    // reveal-on-scroll for cards
    const targets = document.querySelectorAll<HTMLElement>(".aw-landing .reveal");
    let io: IntersectionObserver | null = null;
    if (targets.length && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("aw-in-view");
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      targets.forEach((t) => io!.observe(t));
    } else {
      targets.forEach((t) => t.classList.add("aw-in-view"));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      io?.disconnect();
    };
  }, []);

  return (
    <div className="aw-landing">
      <nav ref={navRef}>
        <div className="logo">
          <span className="dot" />
          AquaWatch
        </div>
        <div className="nav-links">
          <a href="#how">Как работает</a>
          <a href="#tiers">Тарифы</a>
          <a href="#problem">Проблема</a>
          <Link to="/app" className="nav-cta">
            Открыть платформу
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        {/* ambient gradient orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <Star style={{ top: "18%", left: "8%", width: 46, height: 46 }} />
        <Star
          style={{ bottom: "22%", right: "10%", width: 64, height: 64 }}
          color="var(--aw-teal)"
        />

        <div className="hero-inner">
          <div>
            <span className="eyebrow">Сеть мониторинга воды · Казахстан</span>
            <h1>
              <span className="word">Здоровье</span> <span className="word">ваших</span>
              <br />
              <span className="word">
                <span className="water">водоёмов</span>
              </span>
              <br />
              <span className="word">
                <em>в реальном времени</em>
              </span>
            </h1>
            <p className="lead">
              Автономные USV-аппараты AquaWatch измеряют качество воды круглосуточно, а ИИ
              определяет источник загрязнения за секунды — от сточных вод до промышленных сбросов.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="btn btn-primary">
                Запустить AquaWatch →
              </Link>
              <a href="#how" className="btn btn-ghost">
                Как это работает
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <svg className="buoy" viewBox="0 0 200 280">
              {/* mast */}
              <rect x="94" y="10" width="12" height="90" rx="6" fill="#74D426" />
              <circle cx="100" cy="14" r="11" fill="#74D426" />
              <circle cx="100" cy="14" r="5" fill="#0A1A3F" />
              {/* solar panel */}
              <rect
                x="60"
                y="62"
                width="80"
                height="26"
                rx="4"
                fill="#16348F"
                transform="rotate(-8 100 75)"
              />
              <line
                x1="80"
                y1="60"
                x2="74"
                y2="92"
                stroke="#4A8FF0"
                strokeWidth="1.5"
                transform="rotate(-8 100 75)"
              />
              <line
                x1="100"
                y1="58"
                x2="100"
                y2="92"
                stroke="#4A8FF0"
                strokeWidth="1.5"
                transform="rotate(-8 100 75)"
              />
              <line
                x1="120"
                y1="60"
                x2="126"
                y2="92"
                stroke="#4A8FF0"
                strokeWidth="1.5"
                transform="rotate(-8 100 75)"
              />
              {/* float body */}
              <ellipse cx="100" cy="210" rx="62" ry="54" fill="#29A98D" />
              <ellipse cx="100" cy="195" rx="62" ry="40" fill="#34C2A2" />
              <rect x="38" y="150" width="124" height="50" fill="#29A98D" />
              <ellipse cx="100" cy="150" rx="62" ry="26" fill="#3FD4B0" />
              <ellipse cx="100" cy="150" rx="44" ry="17" fill="#16348F" />
              {/* stripe */}
              <path d="M40 178 h120 v10 h-120 z" fill="#74D426" />
              {/* sensor probe */}
              <rect x="96" y="240" width="8" height="34" rx="4" fill="#16348F" />
              <circle cx="100" cy="276" r="6" fill="#4A8FF0" />
            </svg>

            <div className="telemetry t1">
              <div className="label">pH уровень</div>
              <div className="val">
                7.2 <small>норма</small>
              </div>
              <span className="tag tag-ok">↑ стабильно</span>
            </div>
            <div className="telemetry t2">
              <div className="label">Растворённый O₂</div>
              <div className="val">
                8.4 <small>мг/л</small>
              </div>
              <span className="tag tag-warn">○ USV-3 · оз. Боровое</span>
            </div>
            <div className="telemetry t3">
              <div className="label">Микрочастицы</div>
              <div className="val">
                512 <small>ч/м³</small>
              </div>
              <span className="tag tag-ok">низкая концентрация</span>
            </div>
          </div>
        </div>

        {/* scroll-down hint */}
        <div className="scroll-hint">
          <span>Прокрутите</span>
          <span className="arrow" />
        </div>

        {/* curved transition into the dark stats strip */}
        <Wave fill="#0A1A3F" />
      </header>

      {/* STATS */}
      <div className="stats" id="problem">
        <div className="stats-grid">
          <div className="stat">
            <div className="num">85%</div>
            <div className="desc">
              поверхностных водоёмов Казахстана не имеют постоянного мониторинга качества
            </div>
          </div>
          <div className="stat">
            <div className="num">24/7</div>
            <div className="desc">непрерывных измерений вместо редких ручных проб раз в месяц</div>
          </div>
          <div className="stat">
            <div className="num">5</div>
            <div className="desc">
              типов источников загрязнения распознаёт ИИ: бытовые, с/х, промышленные, нефтегаз,
              природные
            </div>
          </div>
          <div className="stat">
            <div className="num">&lt;30с</div>
            <div className="desc">
              от обнаружения аномалии до классификации источника и оповещения
            </div>
          </div>
        </div>
        {/* curved transition into the light "how" section */}
        <Wave fill="#F4F7FF" />
      </div>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="container">
          <div className="section-eyebrow">Архитектура</div>
          <h2>Четыре слоя — от датчика до отчёта</h2>
          <p className="section-lead">
            Данные проходят путь от автономного USV до готового отчёта для государства, клиентов и
            общественности. ИИ подключается только тогда, когда это действительно нужно.
          </p>

          <div className="layers">
            <div className="layer l1 reveal">
              <div className="idx">1</div>
              <div>
                <div className="layer-head">
                  {IconWifi("layer-icon")}
                  <h3>Сбор данных на USV</h3>
                </div>
                <p>
                  ESP32 на MicroPython измеряет показатели прямо в водоёме и проводит первичную
                  проверку пороговых значений — без задержек на связь.
                </p>
              </div>
              <span className="chip">ESP32 · MicroPython</span>
            </div>
            <div className="layer l2 reveal">
              <div className="idx">2</div>
              <div>
                <div className="layer-head">
                  {IconActivity("layer-icon")}
                  <h3>Серверный анализ</h3>
                </div>
                <p>
                  pandas и NumPy сверяют показания с нормативами, выявляют аномалии и градиенты
                  между соседними станциями, чтобы понять направление и скорость распространения
                  загрязнения.
                </p>
              </div>
              <span className="chip">pandas · NumPy</span>
            </div>
            <div className="layer l3 reveal">
              <div className="idx">3</div>
              <div>
                <div className="layer-head">
                  {IconSparkles("layer-icon")}
                  <h3>ИИ-классификация источника</h3>
                </div>
                <p>
                  При аномалии подключается Claude: сверяет сигнатуру загрязнения с библиотекой
                  источников, накладывает данные на карту через geoportal.kz и выдаёт оценку
                  достоверности.
                </p>
              </div>
              <span className="chip">Claude API · GIS</span>
            </div>
            <div className="layer l4 reveal">
              <div className="idx">4</div>
              <div>
                <div className="layer-head">
                  {IconFile("layer-icon")}
                  <h3>Готовые отчёты</h3>
                </div>
                <p>
                  Автоматические отчёты для государственных органов, корпоративных клиентов и
                  публичных дашбордов — на понятном языке, с картой, графиками и выводами.
                </p>
              </div>
              <span className="chip">PDF · Excel · Web</span>
            </div>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" style={{ background: "var(--aw-paper)" }}>
        <div className="container">
          <div className="section-eyebrow">Тарифы</div>
          <h2>Решение под каждый масштаб</h2>
          <p className="section-lead">
            От одной школы до национальной сети мониторинга — три линейки оборудования и сервиса.
          </p>

          <div className="tiers">
            <div className="tier eco reveal">
              {IconLeaf("tier-icon")}
              <div className="series">Series A</div>
              <h3>Eco</h3>
              <div className="who">Школы, экологические НКО, исследователи</div>
              <ul>
                <li>1 USV-аппарат с базовым набором датчиков</li>
                <li>Веб-дашборд с картой и телеметрией в реальном времени</li>
                <li>Образовательные отчёты и экспорт данных</li>
                <li>Сообщество и поддержка</li>
              </ul>
            </div>

            <div className="tier pro reveal">
              <div className="badge">Хит</div>
              {IconZap("tier-icon")}
              <div className="series">Series B</div>
              <h3>Pro</h3>
              <div className="who">Водоканалы, горнодобыча, промышленность</div>
              <ul>
                <li>Парк USV с градиентным анализом между станциями</li>
                <li>ИИ-классификация источников загрязнения</li>
                <li>Оповещения о превышении нормативов</li>
                <li>Отчётность по требованиям регуляторов</li>
                <li>Гарантийное и постгарантийное обслуживание</li>
              </ul>
            </div>

            <div className="tier gov reveal">
              {IconBuilding("tier-icon")}
              <div className="series">Series C</div>
              <h3>Gov</h3>
              <div className="who">Казгидромет, Министерство экологии</div>
              <ul>
                <li>Национальная сеть мониторинга водоёмов</li>
                <li>Интеграция с государственными ГИС-системами</li>
                <li>Публичные дашборды для граждан</li>
                <li>Расширенная аналитика и прогнозирование</li>
                <li>Индивидуальные SLA и сопровождение</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="container">
          <div className="cta">
            <Star
              style={{ top: "14%", left: "12%", width: 40, height: 40 }}
              color="var(--aw-lime)"
            />
            <h2>Сделаем воду прозрачной — в данных и на деле</h2>
            <p>
              Покажем работу AquaWatch на вашем водоёме. Демо и пилот доступны для НКО, предприятий
              и госструктур.
            </p>
            <Link to="/app" className="btn btn-primary">
              Войти в платформу →
            </Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-grid">
          <div>
            <div className="logo">
              <span className="dot" />
              AquaWatch
            </div>
            <p className="footer-tagline">
              Сеть автономных USV-аппаратов для мониторинга качества воды Казахстана.
            </p>
          </div>
          <div>
            <h4>Продукт</h4>
            <ul>
              <li>
                <a href="#how">Как работает</a>
              </li>
              <li>
                <a href="#tiers">Тарифы</a>
              </li>
              <li>
                <Link to="/app">Платформа</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Компания</h4>
            <ul>
              <li>
                <a href="#problem">Проблема</a>
              </li>
              <li>
                <a href="#cta">Связаться</a>
              </li>
              <li>
                <a href="#how">Технология</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Связь</h4>
            <ul>
              <li>
                <a href="mailto:hello@aquawatch.kz">hello@aquawatch.kz</a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Telegram
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 AquaWatch · Капшагайское водохранилище · Казахстан</span>
          <span>Сделано с заботой о воде</span>
        </div>
      </footer>
    </div>
  );
}
