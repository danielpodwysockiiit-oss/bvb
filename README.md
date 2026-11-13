# BVB Fanseite
1. API-Key holen: https://www.football-data.org/client/register (kostenlos)
2. Eigene Dateien in `public/` legen: `ole.mp3` (Lied), optional `tor.mp3` (Torsound)
3. Auf GitHub pushen
4. Render: New > Web Service > Repo wählen. Build: `npm install`, Start: `npm start`
5. Environment Variable setzen: `FOOTBALL_DATA_KEY` = dein Key
Lokal: `FOOTBALL_DATA_KEY=xxx npm start` -> http://localhost:3000
