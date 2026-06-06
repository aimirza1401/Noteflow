# 📝 NoteFlow

Minimalistička PWA aplikacija za bilješke, zadatke i podsjetnike — izgrađena s React + Vite + Supabase.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-2-green?logo=supabase)
![PWA](https://img.shields.io/badge/PWA-ready-orange)
![i18n](https://img.shields.io/badge/i18n-12%20jezika-yellow)

---

## ✨ Funkcionalnosti

- 📋 **Bilješke** s plain-text uređivanjem
- ☑️ **Checklist zadaci** s praćenjem napretka
- 🔔 **Podsjetnici** s ponavljanjem (dnevno, sedmično...)
- 📷 **OCR** — slika u tekst (Google Vision AI ili Tesseract.js offline)
- 🎤 **Glasovni unos** s prepoznavanjem govora (Web Speech API)
- 🗃️ **Tabele** s agregatnim funkcijama (Sum, Avg, Min, Max...)
- 🕐 **Historija izmjena** — vrati bilo koju prethodnu verziju
- 🔗 **Dijeljenje** bilješki putem javnog linka (30 dana)
- 📄 **Export** u PDF i Markdown
- 🌍 **12 jezika** (bs, hr, sr, en, de, fr, it, es, tr, pt, ar, ja)
- 🌙 **Tamni mod** + WC26 tema
- 📱 **PWA** — radi offline, instaliraj na uređaj
- 🤖 **Android** — Capacitor native build

---

## 🚀 Pokretanje

### Preduvjeti
- Node.js >= 20
- Supabase projekt (besplatni tier dovoljan)

### Instalacija

```bash
git clone https://github.com/tvoj-username/noteflow.git
cd noteflow
npm install
```

### Environment varijable

Kreiraj `.env.local` u root direktoriju:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tvoj-anon-key

# Opcionalno — za bolji OCR (Google Vision AI)
VITE_GOOGLE_VISION_KEY=tvoj-google-vision-key
```

### Pokretanje u development modu

```bash
npm run dev
```

### Build za produkciju

```bash
npm run build
npm run preview
```

---

## 🗄️ Supabase setup

### 1. Kreiraj `notes` tabelu

```sql
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  title       text default '',
  content     text default '',
  checklist   jsonb default '[]',
  tables      jsonb default '[]',
  tags        jsonb default '[]',
  starred     boolean default false,
  folder      text default 'projekti',
  reminder    jsonb,
  updated_at  timestamptz default now()
);
```

### 2. Kreiraj `shared_notes` tabelu

```sql
create table shared_notes (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid references notes(id) on delete cascade,
  title       text,
  content     text,
  checklist   jsonb default '[]',
  share_token text unique not null,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);
```

### 3. Row Level Security (RLS)

```sql
-- notes tabela
alter table notes enable row level security;

create policy "Korisnik vidi samo svoje bilješke"
  on notes for select using (auth.uid() = user_id);

create policy "Korisnik kreira svoje bilješke"
  on notes for insert with check (auth.uid() = user_id);

create policy "Korisnik mijenja samo svoje bilješke"
  on notes for update using (auth.uid() = user_id);

create policy "Korisnik briše samo svoje bilješke"
  on notes for delete using (auth.uid() = user_id);

-- shared_notes tabela (javno čitanje)
alter table shared_notes enable row level security;

create policy "Javno čitanje dijeljenih bilješki"
  on shared_notes for select using (true);
```

### 4. Full-text search (opcionalno)

```sql
alter table notes add column fts tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored;

create index notes_fts_idx on notes using gin(fts);
```

---

## 📱 Android build (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## 🏗️ Struktura projekta

```
src/
├── components/        # UI komponente
│   ├── Editor.jsx
│   ├── NoteList.jsx
│   ├── Sidebar.jsx
│   └── ...
├── hooks/             # Custom React hookovi
│   ├── useNotes.js         # Fasada — spaja sve hookove
│   ├── useNotesStore.js    # Dijeljeni state
│   ├── useNotesLoader.js   # Učitavanje + offline sync
│   ├── useNotesFilter.js   # Filtriranje i pretraga
│   ├── useNotesCRUD.js     # CRUD operacije
│   ├── useNotesChecklist.js# Checklist operacije
│   └── useSearch.js        # Full-text pretraga
├── locales/           # i18n prijevodi (12 jezika)
├── data/
│   └── notes.js       # Konstante i početni podaci
├── supabase.js        # Supabase klijent
├── offlineDB.js       # IndexedDB (offline storage)
├── notifications.js   # Push notifikacije
├── shareNote.js       # Dijeljenje bilješki
└── exportPDF.js       # PDF export
```

---

## 🛠️ Tech stack

| Tehnologija | Verzija | Svrha |
|-------------|---------|-------|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| Supabase | 2 | Backend (DB + Auth) |
| Capacitor | 8 | Native Android |
| i18next | 26 | Internacionalizacija |
| Tesseract.js | 6 | Offline OCR |
| jsPDF | 4 | PDF export |
| idb | 8 | IndexedDB wrapper |
| Lucide React | 1 | Ikone |

---

## 📄 Licenca

MIT © 2026 — slobodno koristi, mijenjaj i distribuiraj.
