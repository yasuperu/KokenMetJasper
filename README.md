# Koken met Jasper

## Recepten beheren

Ga naar **https://kokenmetjasper.nl/jk** (zet er een bladwijzer van; er staat nergens een link naar). Het adres staat in `src/site.json` (`adminPath`) en kun je daar veranderen. De beheerpagina wordt nooit door Google geïndexeerd; de echte beveiliging is je GitHub-token.

1. Eenmalig: maak een GitHub fine-grained token (alleen deze repo, *Contents: Read and write*, optioneel *Actions: Read-only*) en plak die op de beheerpagina. De token blijft alleen in je eigen browser.
2. Nieuw recept → vul de velden in. Een ingrediëntenlijst of bereiding kun je in één keer plakken; de ingrediënten worden in de bereiding automatisch gekoppeld. Een regel als `Voor de dressing:` in de geplakte lijst wordt een groep.
3. Opslaan maakt een commit op `main`. De GitHub Action (`.github/workflows/deploy.yml`) bouwt en publiceert de site daarna automatisch (± 2 minuten).

### Bron van een recept

- **Eigen recept**: gewoon openbaar.
- **Social media of website**: openbaar, met een link naar de post (Instagram, TikTok, YouTube, …) en optioneel de maker.
  Met *Bereiding pas tonen nadat de bezoeker de post heeft bekeken* (`"gate": true`) blijven de ingrediënten zichtbaar, maar verschijnt de bereiding pas na een klik naar de post (of met het kookboek-wachtwoord). Zo krijgt de maker de klik. De bereiding staat dan versleuteld in de repo (`gatedSteps`), met een sleutel die in de site zelf zit: op GitHub onleesbaar, na de klik voor iedere bezoeker zichtbaar. Dit is een beleefdheid, geen beveiliging; Google krijgt de bereiding van zulke recepten niet te zien.
- **Uit een kookboek**: versleuteld, zie hieronder.

Heb je een recept van iemand anders zelf aangepast? Vink dan *Ik heb het recept zelf aangepast* aan (en vul eventueel in wat er anders is). Er staat dan "Gebaseerd op …" met "Met eigen aanpassingen" in plaats van "Uit het kookboek" of "Bron".

### Recepten uit kookboeken

Vink *Dit recept komt uit een kookboek* aan en vul titel, auteur en pagina in.

- De ingrediënten en bereiding worden **in je browser versleuteld** (AES-256-GCM, sleutel afgeleid van je wachtwoord) voordat ze worden opgeslagen. In de repo en op de site staat alleen versleutelde tekst.
- Bezoekers zien titel, foto en bronvermelding, met een geblurde nep-weergave. Met het wachtwoord ontgrendel je het recept (en kun je het gewoon schalen en printen).
- Alle boekrecepten gebruiken hetzelfde wachtwoord; `src/data/lock.json` controleert dat. **Ben je het wachtwoord kwijt, dan zijn die recepten niet meer te lezen.**
- Gebruik bij boekrecepten alleen je eigen foto's.

## Vindbaarheid (SEO)

`npm run build` draait na de React-build ook `scripts/prerender.js`. Dat maakt per recept een echte pagina (`/recept/<id>/`) met titel, beschrijving, deelafbeelding (Open Graph) en receptgegevens voor Google (schema.org/Recipe), plus `sitemap.xml`. Kookboekrecepten krijgen geen ingrediënten in die gegevens. De algemene deelafbeelding is `public/og-image.png`.

## Snelheid

- `scripts/prerender.js` rendert de homepage en elk recept vooraf met de echte React-componenten; de browser neemt die HTML over (`hydrateRoot`), zodat de pagina meteen in beeld staat.
- `scripts/optimize-images.js` maakt van elke foto WebP-versies van 480, 720 en 960 px (`public/images/recipes/opt/`, niet in git). Draait vanzelf bij `npm start` en `npm run build`.
- Lettertypen worden zelf gehost (`@fontsource-variable/fraunces` en `inter`) en vooraf geladen.
- De beheerpagina wordt apart geladen, alleen op `/jk`.

## Receptformaat

Recepten staan als JSON in `src/data/recipes/`. Ingrediënten schrijf je in het **enkelvoud**; het meervoud wordt automatisch gemaakt als het aantal personen verandert.

```js
{ "id": "ui", "name": "ui", "amount": 1 }                              // 1 ui → 2 uien
{ "id": "knoflook", "name": "knoflook", "amount": 2, "unit": "teentje" } // 2 teentjes knoflook
{ "id": "gnocchi", "name": "verse gnocchi", "amount": 400, "unit": "gr" } // gr/ml/el/tl: nooit meervoud
{ "id": "wraps", "name": "wrap", "amount": 4, "step": 1 }              // altijd hele stuks
{ "id": "peper", "name": "peper", "amount": 1, "note": "of sambal" }   // toelichting
{ "id": "zout", "name": "zout" }                                       // zonder amount: "naar smaak"
{ "id": "x", "name": "kiwi", "amount": 2, "plural": "kiwi's" }         // eigen meervoud
{ "id": "mayo", "name": "mayonaise", "amount": 2, "unit": "el", "group": "Dressing" } // groep met kopje
```

In de bereiding:

- `{ui}` → hoeveelheid + naam ("2 uien")
- `{ui:naam}` → alleen de naam ("uien"), handig als je er later nog eens naar verwijst

Klopt een meervoud niet? Voeg het woord toe aan `src/data/pluralWords.json`.

Printen: knop "Recept printen" op de receptpagina. De print gebruikt het gekozen aantal personen.

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# KokenMetJasper
