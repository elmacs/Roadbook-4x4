# Roadbook 4x4 — PWA

App web installabile su Android per seguire un roadbook. Fa queste cose:
- fotografa o carica (anche da PDF) i fogli del roadbook ed estrae le caselle (km progressivi, parziale, CAP, indicazioni, pericoli) con un modello vision compatibile OpenAI, ritagliando ogni casella dall'immagine originale;
- fa da trip meter GPS, con filtro anti-jitter, calibrazione %, correzione ±10 m, conteggio inverso e modifica manuale;
- mostra "dalla nota precedente" e "alla prossima nota", che si evidenzia a meno di 100 m;
- conferma le note (con Annulla) e scorre avanti e indietro, con tasti fisici e telecomandi Bluetooth;
- registra la traccia GPS con i punti di conferma, la mostra su OpenTopoMap e la esporta o condivide in GPX;
- funziona offline (service worker e IndexedDB) e tiene lo schermo acceso (Wake Lock).

## Deploy

Il GPS e il service worker funzionano **solo in HTTPS**.

### nginx (es. su k8s)
```bash
docker build -t registry.example/roadbook:1 .
docker push registry.example/roadbook:1
# Deployment + Service + Ingress con TLS, porta 80 del container
```

### Oppure GitHub Pages
Fai il push dei file in un repo, poi Settings → Pages.

Su Android apri l'URL in Chrome, poi ⋮ → **Installa app**.

## Estrazione con vLLM
In Impostazioni metti:
- URL base: `https://<tuo-host>/v1`
- Modello: uno con input immagini (es. `gemma-4-26B-A4B-it`)
- Token: il JWT

Il token resta solo sul telefono (IndexedDB).

**CORS:** vLLM consente `*` per default. Se davanti c'è un reverse proxy che verifica il JWT, deve:
1. far passare le richieste `OPTIONS` (preflight) **senza** token;
2. restituire `Access-Control-Allow-Origin` (l'origine della PWA) e `Access-Control-Allow-Headers: authorization, content-type`.

"Prova connessione" chiama `GET /models`. Se compare "rete o CORS", il problema è quasi sempre il preflight.

Senza LLM usa **Dividi**: la pagina viene tagliata in N righe uguali e km e testo li inserisci a mano.

## Uso in auto
- **▶ Avvia** accende il GPS, registra la traccia e blocca lo spegnimento dello schermo. Tienila in primo piano: se Android la mette in background o spegne lo schermo, Chrome sospende il GPS e il tratto viene contato in linea retta alla ripresa.
- **✓ OK** conferma la nota corrente. Se l'opzione è attiva, allinea il trip al km della nota e salva il punto sulla traccia.
- Tocca il numero grande per impostare il trip a mano. Tieni premuto **+/−** per scorrere veloce.
- Tocca una nota per renderla quella corrente.

Tasti predefiniti (modificabili nell'oggetto `KEYS` in `index.html`):

| Azione | Tasti |
|---|---|
| nota successiva | → ↓ PagGiù, Media Next |
| nota precedente | ← ↑ PagSu, Media Prev |
| conferma | Invio, Spazio, Play/Pausa |
| trip ±10 m | + / − |

## Note
- La mappa (Leaflet) e pdf.js si scaricano da cdnjs la prima volta che li usi, poi restano in cache. Le tile OpenTopoMap richiedono rete.
- La calibrazione si fa su una tratta nota: se il trip segna 9,80 km su 10,00, imposta +2 %.
