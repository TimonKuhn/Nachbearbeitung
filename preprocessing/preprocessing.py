import requests
import matplotlib.pyplot as plt


import json

# JSON-Daten aus einer Datei importieren
with open('preprocessing\get_trajectories.json', 'r') as f:
    traj = json.load(f)

with open('preprocessing\get_journey.json', 'r') as f:
    journey = json.load(f)

# with open('preprocessing\get_calls.json', 'r') as f:
#     calls = json.load(f)

# API_KEY = "yourkey"

# bb = "838667,5997631,909982,6036843"

# request_traj = f"https://api.geops.io/tracker-http/v1/trajectories/sbb/?bbox={bb}&key={API_KEY}&zoom=12"
# response_traj = requests.get(request_traj)

for i in traj['features']:
    if i["properties"]["type"] != 'gondola':
        train_id = i["properties"]["type"]
        print(train_id)

# if response.status_code == 200:
#     daten = response_traj.json()
#     train_id = daten["features"][0]["properties"]["train_id"]
# else:
#     print("Fehler!")

# request_journey = f"https://api.geops.io/tracker-http/v1/journeys/{train_id}/?key={API_KEY}"
# response_journey = requests.get(request_journey)

# journey = response_journey.json()

route = journey['features'][0]['geometry']['geometries'][0]['coordinates']
haltestelle = journey['features'][0]['geometry']['geometries'][1]['coordinates']
lineName = journey['features'][0]['properties']['line_name']
type = journey['features'][0]['properties']['type']

print(haltestelle)
print(lineName)
print(type)

def plot_line_with_points(coordinates, points):
    x_coords, y_coords = zip(*coordinates)
    plt.plot(x_coords, y_coords)
    
    # Punkte auf der Linie markieren
    for point in points:
        plt.scatter(point[0], point[1], color='red')
    
    plt.xlabel('X-Achse')
    plt.ylabel('Y-Achse')
    plt.title('Linie mit Haltestallen')
    plt.axis('equal')
    plt.show()

# Beispiel-Koordinatenliste und Punkte
coordinates = route
points = haltestelle

# Linie mit markierten Punkten plotten
plot_line_with_points(coordinates, points)


# request_calls = f"https://api.geops.io/tracker-http/v1/calls/{train_id}/?key={API_KEY}"
# response_calls = requests.get(request_calls)

# calls = response_calls.json()