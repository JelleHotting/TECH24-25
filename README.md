# TECH24-25
## Eindproject Tech (ClashConnect)

![Group 1](https://github.com/user-attachments/assets/9fce2881-0398-4b54-830f-75a84d01747e)

ClashConnect is dé website voor Clash of Clans-spelers die op zoek zijn naar de perfecte clan! Met onze gebruiksvriendelijke zoekfunctie en slimme vragenlijst vind je eenvoudig een clan die bij jouw past.

## Inhoudsopgave
1. [Installatie-instructies](#installatie-instructies)
2. [API](#api)
3. [MongoDB](#mongodb)
4. [Functionaliteiten](#functionaliteiten)
5. [Contributie-richtlijnen](#contributie-richtlijnen)
6. [Licentie](#licentie)
7. [Contact / Support](#contact--support)

## Installatie-instructies

### Repository clonen
Om aanpassingen te kunnen maken, moet je eerst de repository clonen. Dit doe je als volgt:
1. Ga naar de repository en klik op de groene **Code**-knop bovenaan.

   <img width="925" alt="Scherm­afbeelding 2025-03-31 om 13 01 20" src="https://github.com/user-attachments/assets/6aace92b-38cd-4806-85ea-eb480c7b1f7e" />

2. Kopieer de repository-URL.
3. Open je terminal en voer de volgende code in:
   ```sh
   git clone <repository-URL>
   ```
   Plak hierbij de gekopieerde URL op de plek van `<repository-URL>`. Het ziet er dan als volgt uit:
   ```sh
   git clone https://github.com/JelleHotting/TECH24-25.git
   ```
4. Navigeer naar de map met het volgende commando:
   ```sh
   cd TECH24-25
   ```
   Gefeliciteerd! Je hebt nu een lokale kopie van het project waarmee je kunt werken.

### Packages installeren
Om alle benodigde packages te installeren, voer je het volgende commando uit in de terminal:
```sh
npm install
```
Hiermee worden de volgende dependencies geïnstalleerd:

1. express
2. express-session
3. bcrypt
4. ejs
5. dotenv
6. mongodb

### Applicatie starten
Om de applicatie te starten, voer je het volgende commando uit in de terminal:
```sh
npm start
```
Hiermee wordt de server gestart en kun je de applicatie openen in je webbrowser via `http://localhost:3000`.

## API
Om gebruik te maken van de Clash of Clans API, moet je een API-key aanvragen via [de ontwikkelaarswebsite](https://developer.clashofclans.com/#/). Dit doe je door een account aan te maken en de instructies te volgen om een API-key te genereren.

### MongoDB
Voor dit project maken we gebruik van een MongoDB-database om data op te slaan. Om je eigen database te koppelen, plaats je de volgende gegevens in een `.env`-bestand en vul je deze aan met jouw MongoDB-gegevens:

```env
DB_HOST=
DB_NAME=
DB_USERNAME=
DB_PASSWORD=
DB_COLLECTION=
COC_API_KEY=
```

Zo vind je deze informatie in MongoDB:
1. Ga naar de [MongoDB-website](https://www.mongodb.com/) en log in.
2. Navigeer naar **Clusters**.
3. Klik op **Connect** en volg de stappen.

   <img width="1357" alt="Scherm­afbeelding 2025-03-31 om 14 00 14" src="https://github.com/user-attachments/assets/5da7c428-bfed-4269-a41d-8307ab6acaef" />

## Functionaliteiten
1. Aanmaken van een account en opslaan van inloggegevens in de database.
2. Hashen van wachtwoorden voor extra beveiliging.
3. Inloggen en uitloggen.
4. Zoekfunctie via een zoekbalk.
5. Vragenlijst (Q&A) om een geschikte clanmatch te vinden.
6. Gebruik van List.js om zoekresultaten te filteren.
7. Clans opslaan en verwijderen.

## Contributie-richtlijnen
We verwelkomen bijdragen aan dit project! Volg de onderstaande stappen om bij te dragen:
1. Fork de repository.
2. Maak een nieuwe branch: `git checkout -b naam-van-je-branch`.
3. Voeg je wijzigingen toe: `git add .`
4. Commit je wijzigingen: `git commit -m 'Voeg mijn functie toe'`
5. Push naar de branch: `git push origin naam-van-je-branch`
6. Dien een Pull Request in op GitHub.

## Licentie
Dit project is gelicenseerd onder de MIT-licentie. Zie het [LICENSE-bestand](./LICENSE) voor meer informatie.

## Contact / Support
Voor vragen of ondersteuning, neem contact op met [jouw naam] via [jouw e-mailadres].
