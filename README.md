# 🧭 Deutsch-Kompass

Interaktiver Trainer für deutsche Artikel, Pronomen und Adjektivdeklination.
Sechs Module: Referenz-Atlas · Adjektivdeklination · Geschlecht-Hinweise (Genus-Regeln + Quiz) · Pronomen · Drill-Arena · Schwächen-Heatmap.
Erklärungen auf Deutsch **und Arabisch** (DE/عربي-Schalter oben rechts).

## Starten

Eine von beiden Möglichkeiten:

```sh
npx serve .
```

…oder einfach `index.html` doppelklicken — kein Build, keine Abhängigkeiten, alles offline.

## Bedienung

| Taste | Funktion |
|---|---|
| `1`–`9` | Antwort wählen |
| `Enter` | Weiter / Start |
| `A` / `J` / `G` / `P` / `D` / `S` | Atlas / Adjektivdeklination / Genus / Pronomen / Drill / Statistik |

- **Farben:** Nominativ = Blau, Akkusativ = Bernstein, Dativ = Grün, Genitiv = Lila — überall konsistent. (Rot ist bewusst nur für „falsch“ reserviert.)
- **Fortschritt** liegt in `localStorage`; Export/Import als JSON unter *Statistik*.
- Der Drill wählt Fragen bevorzugt aus deinen schwächsten Tabellenzellen (Leitner-Prinzip).
