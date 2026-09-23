import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { Button, CatchCard, EmptyState, SyncBadge } from "../../ui";
import { AppLayout } from "../../app/AppLayout";
import { db } from "../../data/db";
import { retryCatch } from "../../data/syncEngine";
import { formatCatchCount } from "../../domain/format";

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return `сегодня, ${time}`;
  return `${d.toLocaleDateString("ru-RU")}, ${time}`;
}

/** Лента поимок: зеркало из Dexie + статусы синхронизации §6.11. */
export function FeedPage() {
  const catches = useLiveQuery(
    () => db.catches.orderBy("caughtAt").reverse().toArray(),
    [],
  );
  const species = useLiveQuery(() => db.species.toArray(), []);

  const nameOf = (speciesId: string) =>
    species?.find((sp) => sp.id === speciesId)?.nameRu ?? "Вид";

  return (
    <AppLayout
      title="Мой улов"
      subtitle={
        catches !== undefined && catches.length > 0
          ? formatCatchCount(catches.length)
          : undefined
      }
    >
      {catches === undefined ? null : catches.length === 0 ? (
        <EmptyState
          icon="fish"
          title="Дневник пуст"
          description="Первая поимка появится здесь. Запишите её — остальное приложение подстроит."
          action={
            <Link to="/record">
              <Button variant="primary">Записать поимку</Button>
            </Link>
          }
        />
      ) : (
        <div className="feedList">
          {catches.map((c) => (
            <CatchCard
              key={c.id}
              species={nameOf(c.speciesId)}
              weight={
                c.weightG !== null
                  ? `${(c.weightG / 1000).toFixed(2)} кг`
                  : undefined
              }
              metadata={[
                formatDay(c.caughtAt),
                c.lengthMm !== null ? `${c.lengthMm} см` : "",
              ].filter((m) => m !== "")}
              badge={
                <SyncBadge
                  state={c.syncState}
                  {...(c.syncState === "error"
                    ? {
                        onRetry: () => {
                          void retryCatch(c.id);
                        },
                      }
                    : {})}
                />
              }
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
