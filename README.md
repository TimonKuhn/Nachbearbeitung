# Dokumentation Nacharbeit:

1.) Repo clonen und zur verfügung stellen

2.) Datensätze aussuchen: Ein WM(T)S und ein WFS, gewünscht wären sämmtliche ÖV-Linien und Haltestellen über die gesammte Schweiz. Leider gibt es solche Datensätze nicht. Deswegen wurde diese Funktionalität für Demo-Zwecke auf den Ballungsraum Bern beschränkt: 
https://opendata.swiss/de/dataset/ov-linien
https://opendata.swiss/de/dataset/ov-haltestellen

Die beiden Services wurden in QGis testweise eingebunden, wie in "Datenvisualisierung.png" zu sehen ist:
![Datenvisualisierung](Datenvisualisierung.PNG)
https://map.bern.ch/arcgis/services/Geoportal/Haltestellen/MapServer/WFSServer
https://map.bern.ch/arcgis/services/Geoportal/OeV_Linien/MapServer/WMSServer?request=GetCapabilities&service=WMS

3.) Geoserver konfigurieren, WMS und WFS einbinden, konfigurieren, veröfentlichen und testen.
???leider habe ich nicht die Berechtigung, mit dem Geoserver auf den WFS der Stadt Bern zuzugreifen. ???

4.) Integration im Backend
Wenn es nur eine Verlängerung der Pipline ist...?

5.) Integration im Frontend
npm install gibt warnings und npm run gibt macht nichts




# Bestehende Dokumentation
# ÖV-Now

## Beschreibung
ÖV-Now ist eine App, die Sie über den Verkehr auf dem Laufenden hält, so dass Sie immer die beste Route wählen können.
Die Details entnehmen sie unserer GitHub [Page](Mattia-V01.github.io/ov-now/)



## Installation
1. Klone das Repository auf deinen Computer:
   ```
   git clone git@github.com:benutzername/ov-now.git
   ```
2. Navigiere in das Hauptverzeichnis des Projekts:
   ```
   cd ..\ov-now\client
   ```
3. Installiere die Abhängigkeiten:
   ```
   npm install
   ```

## Konfiguration
löschen vor Abgabe wenn nichts reinkommt.

## Backend
diese Anleitung richtet sich an die Inbetriebnahme des Backends auf dem Raspberry 4 des IGEO:

1.) Raspi starten udn einrichten, d.h. Internetverbindung aufbauen (in diesem Fall mit Handy HotSpot da Raspy nicht ins FH-Netz kommt)

2.) Bash öffnen und zu gewünschtem Root-Verzeichnis navigieren (cd /home/USER/documents)

3.) git clone https://github.com/Mattia-V01/ov-now.git

4.) python -m venv backend

5.) source backend/bin/activate

6.) sudo apt-get install python3-dev

7.) pip install --upgrade setuptools

8.) pip3 install starlette

9.) pip3 install fastapi

10.) pip3 install uvicorn

11.) pip3 install requests

12.) python cd /home/USER/documents/ov-now/server/app/backend.py
-> Beispielabfragen aus den Comments kopieren und ausprobieren. (wobei Beispielabfrage für Endpoint1 18minuten dauerte)


13.) sudo raspi-config 
SSH aktivieren

14.) setup SSH Verbindung: ip a 
unter drittens wlan0 inet ist die ip zu finden

15.) cd ov-now/server/app

16.) uvicorn backend:app --host 0.0.0.0 --port 8000

##nutzendes Gerät

50.) Auf nutzendem Gerät: cmd öffnen und eingeben:
ssh kuhnt@192.168.126.44
password = password

51.) hostname -I
gibt IP zurück falls nicht vorhanden zum Copy Pasten

51.)  "http://192.168.126.44:8000/get_all_journey/?bbox=838667,5997631,909982,6036843&key=5cc87b12d7c5370001c1d65576ce5bd4be5a4a349ca401cdd7cac1ff&zoom=12"

52.)  "http://192.168.126.44:8000/get_info/?train_id=sbb_140523186358112&key=5cc87b12d7c5370001c1d65576ce5bd4be5a4a349ca401cdd7cac1ff"









## Verwendung
1. Öffne deinen Browser und gehe zu `http://localhost:3000`.
2. 
3. 
4. 

