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
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
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
          </div>
        </div>
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
            <div className="layer l1">
              <div className="idx">1</div>
              <div>
                <h3>Сбор данных на USV</h3>
                <p>
                  ESP32 на MicroPython измеряет показатели прямо в водоёме и проводит первичную
                  проверку пороговых значений — без задержек на связь.
                </p>
              </div>
              <span className="chip">ESP32 · MicroPython</span>
            </div>
            <div className="layer l2">
              <div className="idx">2</div>
              <div>
                <h3>Серверный анализ</h3>
                <p>
                  pandas и NumPy сверяют показания с нормативами, выявляют аномалии и градиенты
                  между соседними станциями, чтобы понять направление и скорость распространения
                  загрязнения.
                </p>
              </div>
              <span className="chip">pandas · NumPy</span>
            </div>
            <div className="layer l3">
              <div className="idx">3</div>
              <div>
                <h3>ИИ-классификация источника</h3>
                <p>
                  При аномалии подключается Claude: сверяет сигнатуру загрязнения с библиотекой
                  источников, накладывает данные на карту через geoportal.kz и выдаёт оценку
                  достоверности.
                </p>
              </div>
              <span className="chip">Claude API · GIS</span>
            </div>
            <div className="layer l4">
              <div className="idx">4</div>
              <div>
                <h3>Готовые отчёты</h3>
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
            <div className="tier eco">
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

            <div className="tier pro">
              <div className="badge">Хит</div>
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

            <div className="tier gov">
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
        <div className="logo">
          <span className="dot" />
          AquaWatch
        </div>
        <p className="small">Мониторинг качества воды · Казахстан · © 2026 AquaWatch</p>
      </footer>
    </div>
  );
}
