# ─── KAKO PUSHATI NA GITHUB ──────────────────────────────────────────────────
#
# KORAK 1: Pripremi lokalni repo (ako nije već inicijaliziran)
#
#   git init
#   git remote add origin https://github.com/tvoj-username/noteflow.git
#
# ─────────────────────────────────────────────────────────────────────────────
#
# KORAK 2: Provjeri što ideš commitati
#
#   git status
#   git diff
#
# ─────────────────────────────────────────────────────────────────────────────
#
# KORAK 3: Dodaj fajlove
#
#   git add .
#
#   ili selektivno:
#   git add src/hooks/
#   git add .gitignore README.md
#
# ─────────────────────────────────────────────────────────────────────────────
#
# KORAK 4: Commit
#
#   Preporučeni format commit poruka:
#
#   feat: dodana nova funkcionalnost
#   fix: ispravljen bug
#   refactor: refaktoring bez promjene funkcionalnosti
#   docs: promjene dokumentacije
#   style: formatiranje, bez promjene logike
#   chore: build, dependencije, konfig
#
#   Primjeri:
#   git commit -m "refactor: razbijen useNotes.js na manje hookove"
#   git commit -m "feat: dodan mobilni layout s bottom navigation"
#   git commit -m "fix: ispravljen sync offline queue-a"
#
# ─────────────────────────────────────────────────────────────────────────────
#
# KORAK 5: Push
#
#   git push -u origin main
#
#   ili ako radiš na feature branchu (preporučeno):
#   git checkout -b feature/refactor-hooks
#   git push -u origin feature/refactor-hooks
#
# ─────────────────────────────────────────────────────────────────────────────
#
# BRANCHING STRATEGIJA (preporučeno):
#
#   main          → uvijek stabilan, produkcijski kod
#   develop       → integracijska grana
#   feature/xxx   → nova funkcionalnost
#   fix/xxx       → ispravak buga
#   refactor/xxx  → refaktoring
#
# ─────────────────────────────────────────────────────────────────────────────
#
# !! NIKAD NE COMMITAJ !!
#
#   .env.local              (Supabase ključevi)
#   .env                    (environment varijable)
#   node_modules/           (automatski ignorisano)
#   android/local.properties (Android keystore putanje)
#
# Provjeri da li su u .gitignore:
#   cat .gitignore | grep env
#
# ─────────────────────────────────────────────────────────────────────────────
