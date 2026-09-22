-- Зорька. Миграция 0001: справочник видов рыбы (ADR-0009)
-- id детерминированы из латинского имени (uuid v5-подобная схема),
-- чтобы сид давал одинаковые id в local / staging / production.

create table if not exists species (
  id          uuid primary key,
  name_ru     text not null unique,
  name_latin  text,
  family      text not null,
  is_predator boolean not null default false,
  icon        text not null default 'fish',
  created_at  timestamptz not null default now()
);

alter table species enable row level security;

-- Справочник глобальный: всем — чтение, запись только через миграции (service role).
create policy "species read for all" on species
  for select using (true);

create index if not exists species_name_latin_idx on species (name_latin);

-- ------------------------------------------------------------------
-- Сид: 51 вид средней полосы РФ.
-- id = ('00000000-0000-4000-8000-' || md5(latin_name)[..12])::uuid
-- ------------------------------------------------------------------

insert into species (id, name_ru, name_latin, family, is_predator, icon) values
-- Карповые (Cyprinidae)
(('00000000-0000-4000-8000-' || right(md5('Cyprinus carpio carpio'), 12))::uuid, 'Сазан', 'Cyprinus carpio carpio', 'Карповые', false, 'carp'),
(('00000000-0000-4000-8000-' || right(md5('Cyprinus carpio domesticus'), 12))::uuid, 'Карп', 'Cyprinus carpio domesticus', 'Карповые', false, 'carp'),
(('00000000-0000-4000-8000-' || right(md5('Tinca tinca'), 12))::uuid, 'Линь', 'Tinca tinca', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Carassius carassius'), 12))::uuid, 'Карась золотой', 'Carassius carassius', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Carassius gibelio'), 12))::uuid, 'Карась серебряный', 'Carassius gibelio', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Rutilus rutilus'), 12))::uuid, 'Плотва', 'Rutilus rutilus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Scardinius erythrophthalmus'), 12))::uuid, 'Краснопёрка', 'Scardinius erythrophthalmus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Blicca bjoerkna'), 12))::uuid, 'Густера', 'Blicca bjoerkna', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Abramis brama'), 12))::uuid, 'Лещ', 'Abramis brama', 'Карповые', false, 'bream'),
(('00000000-0000-4000-8000-' || right(md5('Ballerus ballerus'), 12))::uuid, 'Синец', 'Ballerus ballerus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Ballerus sapa'), 12))::uuid, 'Сопа (белоглазка)', 'Ballerus sapa', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Pelecus cultratus'), 12))::uuid, 'Чехонь', 'Pelecus cultratus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Alburnus alburnus'), 12))::uuid, 'Уклейка', 'Alburnus alburnus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Leucaspius delineatus'), 12))::uuid, 'Верховка', 'Leucaspius delineatus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Squalius cephalus'), 12))::uuid, 'Голавль', 'Squalius cephalus', 'Карповые', true, 'chub'),
(('00000000-0000-4000-8000-' || right(md5('Leuciscus idus'), 12))::uuid, 'Язь', 'Leuciscus idus', 'Карповые', false, 'ide'),
(('00000000-0000-4000-8000-' || right(md5('Aspius aspius'), 12))::uuid, 'Жерех', 'Aspius aspius', 'Карповые', true, 'asp'),
(('00000000-0000-4000-8000-' || right(md5('Leuciscus leuciscus'), 12))::uuid, 'Елец', 'Leuciscus leuciscus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Gobio gobio'), 12))::uuid, 'Пескарь', 'Gobio gobio', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Phoxinus phoxinus'), 12))::uuid, 'Гольян', 'Phoxinus phoxinus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Alburnoides bipunctatus'), 12))::uuid, 'Быстрянка', 'Alburnoides bipunctatus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Ctenopharyngodon idella'), 12))::uuid, 'Белый амур', 'Ctenopharyngodon idella', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Hypophthalmichthys molitrix'), 12))::uuid, 'Толстолобик белый', 'Hypophthalmichthys molitrix', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Hypophthalmichthys nobilis'), 12))::uuid, 'Толстолобик пестрый', 'Hypophthalmichthys nobilis', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Barbus barbus'), 12))::uuid, 'Усач', 'Barbus barbus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Chondrostoma nasus'), 12))::uuid, 'Подуст', 'Chondrostoma nasus', 'Карповые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Vimba vimba'), 12))::uuid, 'Рыбец (сырть)', 'Vimba vimba', 'Карповые', false, 'fish'),
-- Вьюновые (Cobitidae / Misgurnidae)
(('00000000-0000-4000-8000-' || right(md5('Cobitis taenia'), 12))::uuid, 'Щиповка', 'Cobitis taenia', 'Вьюновые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Misgurnus fossilis'), 12))::uuid, 'Вьюн', 'Misgurnus fossilis', 'Вьюновые', false, 'fish'),
-- Окунёвые (Percidae)
(('00000000-0000-4000-8000-' || right(md5('Perca fluviatilis'), 12))::uuid, 'Окунь', 'Perca fluviatilis', 'Окунёвые', true, 'perch'),
(('00000000-0000-4000-8000-' || right(md5('Sander lucioperca'), 12))::uuid, 'Судак', 'Sander lucioperca', 'Окунёвые', true, 'zander'),
(('00000000-0000-4000-8000-' || right(md5('Sander volgensis'), 12))::uuid, 'Берш', 'Sander volgensis', 'Окунёвые', true, 'perch'),
(('00000000-0000-4000-8000-' || right(md5('Gymnocephalus cernua'), 12))::uuid, 'Ёрш', 'Gymnocephalus cernua', 'Окунёвые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Gymnocephalus lucioperca'), 12))::uuid, 'Носарь (ёрш-носарь)', 'Gymnocephalus lucioperca', 'Окунёвые', true, 'fish'),
-- Щуковые (Esocidae)
(('00000000-0000-4000-8000-' || right(md5('Esox lucius'), 12))::uuid, 'Щука', 'Esox lucius', 'Щуковые', true, 'pike'),
-- Сомовые (Siluridae)
(('00000000-0000-4000-8000-' || right(md5('Silurus glanis'), 12))::uuid, 'Сом', 'Silurus glanis', 'Сомовые', true, 'catfish'),
-- Икталуровые (Ictaluridae, прудовые интродуценты)
(('00000000-0000-4000-8000-' || right(md5('Ictalurus punctatus'), 12))::uuid, 'Канальный сомик', 'Ictalurus punctatus', 'Икталуровые', false, 'catfish'),
-- Налимовые (Lotidae)
(('00000000-0000-4000-8000-' || right(md5('Lota lota'), 12))::uuid, 'Налим', 'Lota lota', 'Налимовые', true, 'burbot'),
-- Ротан (Odontobutidae, инвазивный)
(('00000000-0000-4000-8000-' || right(md5('Perccottus glenii'), 12))::uuid, 'Ротан (головёшка)', 'Perccottus glenii', 'Рогатковые', true, 'fish'),
-- Керчаковые (Cottidae)
(('00000000-0000-4000-8000-' || right(md5('Cottus gobio'), 12))::uuid, 'Бычок-подкаменщик', 'Cottus gobio', 'Керчаковые', false, 'fish'),
-- Бычковые (Gobiidae)
(('00000000-0000-4000-8000-' || right(md5('Neogobius melanostomus'), 12))::uuid, 'Бычок-кругляк', 'Neogobius melanostomus', 'Бычковые', false, 'fish'),
-- Осетровые (Acipenseridae)
(('00000000-0000-4000-8000-' || right(md5('Acipenser ruthenus'), 12))::uuid, 'Стерлядь', 'Acipenser ruthenus', 'Осетровые', false, 'sturgeon'),
-- Лососёвые (Salmonidae)
(('00000000-0000-4000-8000-' || right(md5('Salmo salar'), 12))::uuid, 'Лосось атлантический', 'Salmo salar', 'Лососёвые', true, 'salmon'),
(('00000000-0000-4000-8000-' || right(md5('Salmo trutta'), 12))::uuid, 'Форель ручьевая (кумжа)', 'Salmo trutta', 'Лососёвые', true, 'trout'),
(('00000000-0000-4000-8000-' || right(md5('Oncorhynchus mykiss'), 12))::uuid, 'Форель радужная', 'Oncorhynchus mykiss', 'Лососёвые', true, 'trout'),
(('00000000-0000-4000-8000-' || right(md5('Coregonus lavaretus'), 12))::uuid, 'Сиг', 'Coregonus lavaretus', 'Лососёвые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Coregonus albula'), 12))::uuid, 'Ряпушка', 'Coregonus albula', 'Лососёвые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Coregonus peled'), 12))::uuid, 'Пелядь', 'Coregonus peled', 'Лососёвые', false, 'fish'),
(('00000000-0000-4000-8000-' || right(md5('Thymallus thymallus'), 12))::uuid, 'Хариус', 'Thymallus thymallus', 'Лососёвые', false, 'grayling'),
-- Корюшковые (Osmeridae)
(('00000000-0000-4000-8000-' || right(md5('Osmerus eperlanus'), 12))::uuid, 'Корюшка европейская', 'Osmerus eperlanus', 'Корюшковые', true, 'smelt'),
-- Речные угри (Anguillidae)
(('00000000-0000-4000-8000-' || right(md5('Anguilla anguilla'), 12))::uuid, 'Речной угорь', 'Anguilla anguilla', 'Речные угри', true, 'eel')
on conflict (name_ru) do nothing;
