import { useCallback, useEffect, useState } from "react";
import { EmptyState, OfflineBanner, SpeciesTile } from "../../ui";
import { AppLayout } from "../../app/AppLayout";
import { FloatInput } from "../../ui/FloatInput/FloatInput";
import { listSpecies } from "../../data/speciesRepository";
import type { SpeciesRef } from "../../domain/types";
import s from "./RecordPage.module.css";

/** Этап 4: каркас «Записи» — первый сквозной запрос: справочник видов из Postgres. */
export function RecordPage() {
  const [species, setSpecies] = useState<SpeciesRef[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSpecies()
      .then((list) => {
        if (!cancelled) setSpecies(list);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const normalized = query.trim().toLowerCase();
  const filtered =
    species === null
      ? null
      : normalized === ""
        ? species
        : species.filter(
            (sp) =>
              sp.nameRu.toLowerCase().includes(normalized) ||
              (sp.nameLatin !== null &&
                sp.nameLatin.toLowerCase().includes(normalized)),
          );

  return (
    <AppLayout
      title="Новая поимка"
      subtitle="Добавьте главное — остальное подставим"
      banner={<OfflineBanner />}
    >
      <section className={s.section}>
        <h2 className={s.sectionLabel}>Вид рыбы</h2>

        <FloatInput
          label="Поиск по справочнику"
          type="search"
          value={query}
          onChange={setQuery}
        />

        {loadError && (
          <EmptyState
            icon="wifi-off"
            title="Справочник недоступен"
            description="Проверьте соединение и попробуйте ещё раз"
          />
        )}

        {!loadError && filtered === null && (
          <div className={s.skeletonGrid} aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={s.skeletonTile} />
            ))}
          </div>
        )}

        {filtered !== null && filtered.length === 0 && (
          <EmptyState
            icon="fish"
            title="Вид не найден"
            description="Такого вида нет в справочнике. Он пополняется через обновления приложения."
          />
        )}

        {filtered !== null && filtered.length > 0 && (
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
      </section>
    </AppLayout>
  );
}
