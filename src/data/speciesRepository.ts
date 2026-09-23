// Зорька. Repository справочника видов. UI читает только через этот слой.
import { supabase } from "../lib/supabase";
import type { SpeciesRef } from "../domain/types";

interface SpeciesRow {
  id: string;
  name_ru: string;
  name_latin: string | null;
  family: string;
  is_predator: boolean;
  icon: string;
}

function toDomain(row: SpeciesRow): SpeciesRef {
  return {
    id: row.id,
    nameRu: row.name_ru,
    nameLatin: row.name_latin,
    family: row.family,
    isPredator: row.is_predator,
    icon: row.icon,
  };
}

/** Весь справочник (51 вид средней полосы). */
export async function listSpecies(): Promise<SpeciesRef[]> {
  const { data, error } = await supabase
    .from("species")
    .select("id, name_ru, name_latin, family, is_predator, icon")
    .order("name_ru");

  if (error) throw error;
  return (data ?? []).map(toDomain);
}
