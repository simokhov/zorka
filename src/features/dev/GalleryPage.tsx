import { useState } from "react";
import {
  Button,
  CatchCard,
  Chip,
  ChipRow,
  FloatInput,
  OfflineBanner,
  SpeciesTile,
  Stepper,
  SyncBadge,
  TabBar,
  WeatherLine,
} from "../../ui";
import s from "./GalleryPage.module.css";

const photoPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23c0d8e4'/%3E%3C/svg%3E";

function InteractiveFloatInput() {
  const [value, setValue] = useState("Щука");
  return (
    <FloatInput
      label="Вид"
      value={value}
      onChange={setValue}
      inputMode="text"
      name="species-demo"
    />
  );
}

function InteractiveStepper({
  initial,
  error,
}: {
  initial?: number | null;
  error?: string | undefined;
}) {
  const [value, setValue] = useState<number | null>(initial ?? null);
  return (
    <Stepper
      label="Вес"
      unit="г"
      step={50}
      value={value}
      {...(error !== undefined ? { error } : {})}
      onChange={setValue}
      onValueInput={setValue}
    />
  );
}

export function GalleryPage() {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Галерея компонентов</h1>
        <p className={s.intro}>
          Живой стенд дизайн-системы §6. Сверка с макетом и регрессии состояний.
        </p>
      </header>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Button</h2>
        <div className={s.row}>
          <Button>Сохранить поимку</Button>
          <Button variant="secondary">Добавить фото</Button>
          <Button variant="ghost">Пропустить</Button>
          <Button disabled>Сохранить</Button>
          <Button loading>Сохранить поимку</Button>
        </div>
        <div className={s.row}>
          <Button size="sm" icon="plus">
            Записать
          </Button>
          <Button size="sm" variant="secondary" icon="camera">
            Фото
          </Button>
          <Button size="sm" variant="ghost">
            Отмена
          </Button>
          <Button size="sm" loading>
            Отправляем
          </Button>
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Chip</h2>
        <ChipRow>
          <Chip>Все</Chip>
          <Chip active>Хищник</Chip>
          <Chip count={12}>Щука</Chip>
          <Chip active count={3}>
            Трофеи
          </Chip>
        </ChipRow>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>SpeciesTile</h2>
        <div className={s.tileGrid}>
          <SpeciesTile label="Щука" />
          <SpeciesTile label="Окунь" variant="alt" />
          <SpeciesTile label="Судак" selected />
          <SpeciesTile label="Карп" icon="fish" />
          <SpeciesTile label="Плотва" variant="alt" />
          <SpeciesTile label="Сом" />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Stepper</h2>
        <div className={s.stack}>
          <InteractiveStepper />
          <InteractiveStepper initial={1200} />
          <InteractiveStepper initial={5000} error="Значение вне диапазона" />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>FloatInput</h2>
        <div className={s.stack}>
          <FloatInput label="Место" name="demo-empty" />
          <InteractiveFloatInput />
          <FloatInput
            label="Снасть"
            defaultValue="Спиннинг"
            error="Заполните обязательное поле"
            name="demo-error"
          />
          <FloatInput
            label="Приманка"
            defaultValue="Воблер"
            disabled
            name="demo-disabled"
          />
          <FloatInput label="Заметка" multiline name="demo-note" />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>CatchCard</h2>
        <div className={s.stack}>
          <CatchCard
            species="Щука"
            weight="1 200 г"
            photo={{ src: photoPlaceholder, alt: "Фото поимки: щука" }}
            metadata={["8:40 · Лесное озеро", "Спиннинг · Воблер", "+18°"]}
            badge={<SyncBadge state="pending" />}
          />
          <CatchCard
            species="Окунь"
            weight="350 г"
            metadata={["7:15 · Тихий затон", "Поплавок · Червь"]}
            badge={<SyncBadge state="synced" />}
          />
          <CatchCard
            species="Судак"
            weight="2 400 г"
            trophy
            metadata={["21:30 · Лесное озеро", "Джиг · Силикон"]}
          />
          <CatchCard
            species="Карась"
            weight="480 г"
            metadata={["9:05 · Тихий затон"]}
            badge={<SyncBadge state="error" onRetry={() => undefined} />}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>SyncBadge</h2>
        <div className={s.row}>
          <SyncBadge state="pending" />
          <SyncBadge state="syncing" />
          <SyncBadge state="synced" />
          <SyncBadge state="error" onRetry={() => undefined} />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>WeatherLine</h2>
        <div className={s.stack}>
          <WeatherLine
            state={{
              kind: "data",
              temperature: "+18°",
              details: ["Ветер 3 м/с", "752 мм"],
            }}
          />
          <WeatherLine state={{ kind: "missing" }} />
          <WeatherLine state={{ kind: "loading" }} />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>OfflineBanner</h2>
        <OfflineBanner />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>TabBar</h2>
        <p className={s.hint}>
          Фиксированный, как на реальном экране — внизу страницы (внизу области
          просмотра).
        </p>
      </section>

      <TabBar
        items={[
          { to: "/", label: "Лента", icon: "feed", badge: 2 },
          { to: "/map", label: "Карта", icon: "map-pin" },
          { to: "/stats", label: "Итоги", icon: "trophy", badge: 1 },
        ]}
      />
    </div>
  );
}
