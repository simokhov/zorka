import { Button, EmptyState } from "../../ui";
import { AppLayout } from "../../app/AppLayout";
import { Link } from "react-router-dom";

/** Этап 4: каркас ленты с пустым состоянием (§7.4, макет 01 — заголовок/подзаголовок). */
export function FeedPage() {
  return (
    <AppLayout title="Мой улов" subtitle="Пока ни одной поимки">
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
    </AppLayout>
  );
}
