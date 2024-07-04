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

WMS läuft auf anhieb ohne Probleme.
WFS läuft im QGis test. Im Geoserver nicht. Über die Netzwerkdiagnose wurde in QGis der Link zu den GetCapabilities herausgefunden, welcher ansonsten versteckt war. Leider wieder kein Erfolg.

Aus einem nicht herausgefundenen Grund kann ich die in QGIS und im Browser funktionierende GetCapabilities URL zwar in der erstellung des Datastore angeben, im Log des Errors beim Preview kommt jedoch heraus, dass es eine andere url abfragt.

In der Layerdefinition kann definiert werden, dass die Koordinaten von LV95 auf Web-Mercator Projeziert werden sollen.
So läuft der WMS nun (auch in QGIS), eine  Beispielabfrage im Browser ist hiermit möglich: Wichtigstes Learning war hierbei, dass der Layername vor allem über den Workspace definiert wird!
http://localhost:8080/geoserver/wms?service=WMS&version=1.1.1&request=GetMap&layers=ne:0&bbox=821802.7469837219,5615499.530783547,860986.6866042244,5919283.470404049&width=256&height=256&srs=EPSG:3857&format=image/png



???leider habe ich nicht die Berechtigung, mit dem Geoserver auf den WFS der Stadt Bern zuzugreifen. ???


4.) Integration im Backend von WMS und WFS:

Pipeline ist nun:
Extern (Stadt Bern) -> Geoserver (mit Transformation) -> Backend -> Frontend

Nachdem der WMS Dienst auf dem Geoserver funktionierte, konnte er auch im Backend zum laufen gebracht werden. Wenn das Backend auf Localhost:8000 läuft funktioniert folgende Abfrage:
http://localhost:8000/wms/?layers=ne:0&bbox=821802.7469837219,5615499.530783547,860986.6866042244,5919283.470404049&width=256&height=256


!!!! reset backend auf stand vor letzer anpassung, da koordinatentransformation jetzt im geoserver !!!

Bestehen bleibt die Pipline der bisherige API's:
geOps -> Backend -> Frontend
Leider funktioniert dieser nicht mehr da die API unseren Zugrif nicht mehr gestattet.
Auch mit einem neuen API-Key funktioniert diese API leider nicht mehr für das Projekt, der Code läuft soweit.


5.) Integration im Frontend

npm install gibt warnings und npm run gibt macht nicht was man benötigt. So kann das App nicht lokal getestet werden.
Das Problem lag am Pfad des Repos im Onedrive-Ordner. Nach einer Verschiebung auf ein tieferes Ordnerlevel ohne Leerschläge gibt es keine Probleme mehr, das Frontend zu starten.

Das Frontend könnte auf die bisherigen, von GeOps gespiessenen API's zugreifen, würden diese nicht blockiert werden. 

Stand jetzt funktioniert die Abfrage vom eigenen WMS im Backend noch nicht.




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

