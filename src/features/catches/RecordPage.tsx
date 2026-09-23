import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Button, EmptyState, SpeciesTile, Stepper } from "../../ui";
import { AppLayout } from "../../app/AppLayout";
import { FloatInput } from "../../ui/FloatInput/FloatInput";
import { db } from "../../data/db";
import { refreshSpeciesCache } from "../../data/speciesCache";
import { enqueueCatchDraft } from "../../data/syncEngine";
import { useSessionStore } from "../auth/sessionStore";
import s from "./RecordPage.module.css";

/** «Запись»: выбор вида из локального кэша справочника, вес/длина, сохранение в outbox. */
export function RecordPage() {
  const navigate = useNavigate();
  const userId = useSessionStore((st) => st.session?.user.id);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weightG, setWeightG] = useState<number | null>(null);
  const [lengthMm, setLengthMm] = useState<number | null>(null);

  // Кэш справочника обновляется при наличии сети; чтение — всегда из Dexie.
  useEffect(() => {
    void refreshSpeciesCache();
  }, []);

  const species = useLiveQuery(
    () => db.species.orderBy("nameRu").toArray(),
    [],
  );

  const normalized = query.trim().toLowerCase();
  const filtered =
    species === undefined
      ? undefined
      : normalized === ""
        ? species
        : species.filter(
            (sp) =>
              sp.nameRu.toLowerCase().includes(normalized) ||
              (sp.nameLatin !== null &&
                sp.nameLatin.toLowerCase().includes(normalized)),
          );

  const handleToggle = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedId === null || userId === undefined) return;
    await enqueueCatchDraft({
      id: crypto.randomUUID(),
      userId,
      speciesId: selectedId,
      placeId: null,
      lat: null,
      lon: null,
      caughtAt: new Date().toISOString(),
      weightG,
      lengthMm,
      count: 1,
      tackle: null,
      bait: null,
      depthM: null,
      weather: null,
      notes: null,
      deletedAt: null,
    });
    navigate("/");
  }, [selectedId, userId, weightG, lengthMm, navigate]);

  return (
    <AppLayout
      title="Новая поимка"
      subtitle="Добавьте главное — остальное подставим"
    >
      <section className={s.section}>
        <h2 className={s.sectionLabel}>Вид рыбы</h2>

        <FloatInput
          label="Поиск по справочнику"
          type="search"
          value={query}
          onChange={setQuery}
        />

        {filtered === undefined ? (
          <div className={s.skeletonGrid} aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={s.skeletonTile} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="fish"
            title="Вид не найден"
            description="Такого вида нет в справочнике. Он пополняется через обновления приложения."
          />
        ) : (
          <div className={s.grid} role="listbox" aria-label="Выбор вида рыбы">
            {filtered.map((sp, i) => (
              <SpeciesTile
                key={sp.id}
                label={sp.nameRu}
                variant={i % 2 === 0 ? "blue" : "alt"}
                selected={selectedId === sp.id}
                onToggle={() => handleToggle(sp.id)}
              />
            ))}
          </div>
        )}

        <div className={s.steppers}>
          <Stepper
            label="Вес"
            unit="г"
            step={50}
            min={0}
            value={weightG}
            onChange={setWeightG}
          />
          <Stepper
            label="Длина"
            unit="см"
            step={1}
            min={0}
            value={lengthMm}
            onChange={setLengthMm}
          />
        </div>

        <div className={s.stickyCta}>
          <Button
            variant="primary"
            icon="check"
            disabled={selectedId === null || userId === undefined}
            onClick={() => void handleSave()}
          >
            Сохранить поимку
          </Button>
        </div>
      </section>
    </AppLayout>
  );
}
