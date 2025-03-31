# TECH24-25
 Eindproject tech (ClashConnect)
 
![Group 8](https://github.com/user-attachments/assets/9fce2881-0398-4b54-830f-75a84d01747e)

Clash Connect is dé website voor Clash of Clans-spelers die op zoek zijn naar de perfecte clan! Met onze gebruiksvriendelijke zoekfunctie en slimme vragenlijst vind je eenvoudig een clan die bij jouw speelstijl past. Maak een profiel aan, sla je favoriete clans op en beheer je matches moeiteloos. Of je nu een casual speler of een competitieve strijder bent, Clash Connect helpt je de juiste community te vinden! 🚀🔥

## Instalatie instructies

### Clone reposetory
Aller eerst zou je de repository moeten clonen om het aan te kunnen passen. Dat kan als volgt:
1. Ga naar de repository en klik op de groene code knop die boven aan staat.
<img width="925" alt="Scherm­afbeelding 2025-03-31 om 13 01 20" src="https://github.com/user-attachments/assets/6aace92b-38cd-4806-85ea-eb480c7b1f7e" />

2. Vervolgens ga je naar je terminal en plak je de volgende code in je terminal: git clone <repository-URL>. De URL die je hebt gecopieerd bij stap 1 plak je waar repository-URL staat in de code. Het ziet er dan als volgt uit:
```git clone <[repository-URL](https://github.com/JelleHotting/TECH24-25.git)>```.

4. Navigeer naar de map. Gefeliciteerd nu heb je een lokaal mapje van het project waarmee je kan werken.

### Packages instaleren
Om alle packages te instaleren zou je in je terminal 
``` npm install ``` moeten invoeren en op enter drukken. Nu zou je alle packages moeten hebben. Dat zijn de volgende packeges:

1. express
2. express sessions
3. bcrypt
4. ejs
5. dotenv
6. mongodb

## API
Om gebruik te maken van de api zou je een api key moeten aanvragen via https://developer.clashofclans.com/#/. Dat doe je door een account aan te maken en de stappen volgend op de website. Deze API key gebruik je vervolgens om connectie te maken met de database.

### Mongodb
voor dit project hebben wij via mongodb een database opgezet om onze data op te slaan. Om jou eigen database te koppelen van mongodb, dan zou je de volgende code in een .env bestand moeten zetten en aanvullen met de informatie van je mongodb database.

1. ```DB_HOST=```
2. ```DB_NAME=```
3. ```DB_USERNAME=```
4. ```DB_PASSWORD=```
5. ```DB_COLLECTION=```
6. ```COC_API_KEY=```

Deze informatie vind je als volgt in mongodb:
1. Ga naar de website en log in.
2. Ga naar clusters.
3. klik op connect en volg de stappen.

<img width="1357" alt="Scherm­afbeelding 2025-03-31 om 14 00 14" src="https://github.com/user-attachments/assets/5da7c428-bfed-4269-a41d-8307ab6acaef" />

## Hoe te gebruiken

## Functionaliteiten
1. Het maken van een account en het bewaren van de login gegeven in de database.
2. hashen van de wachtwoorden voor extra beveiliging van de gebruikers account.
3. Inlog functie.
4. uitlog functie.
5. search bar zoek functie.
6. Q&A zoek functie om een match voor je te vinden.
7. List js om te filteren in de search results
8. Clans opslaan en verwijderen.


## Contributie Richtlijnen 

## License

## Contact / Support


