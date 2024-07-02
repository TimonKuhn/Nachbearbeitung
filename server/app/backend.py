from fastapi import FastAPI, Query, HTTPException, Response
import requests
from functools import lru_cache
from fastapi.middleware.cors import CORSMiddleware
from pyproj import Transformer
from owslib.wms import WebMapService
from owslib.wfs import WebFeatureService
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the API key
key = "5cc87b12d7c5370001c1d65540afe0006ee14b27ada46ebdfecaab5f"

# Function to fetch GeoJSON data from the provided API link
@lru_cache(maxsize=128)
def fetch_geojson_from_external_api(api_url):
    try:
        print(f"Fetching GeoJSON data from URL: {api_url}")  # Log the URL
        response = requests.get(api_url)
        response.raise_for_status()  # Raise an HTTPError for bad responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch GeoJSON data: {e}")  # Log the error
        # Return an empty GeoJSON structure on error
        return {"type": "FeatureCollection", "features": []}

# Function to fetch Journeys data for a given train ID
@lru_cache(maxsize=128)
def fetch_journeys_for_train_id(train_id, key):
    api_url = f"https://api.geops.io/tracker-http/v1/journeys/{train_id}/?key={key}"
    return fetch_geojson_from_external_api(api_url)

# Function to fetch Calls data for a given train ID
@lru_cache(maxsize=128)
def fetch_calls_for_train_id(train_id, key):
    api_url = f"https://api.geops.io/tracker-http/v1/calls/{train_id}/?key={key}"
    return fetch_geojson_from_external_api(api_url)

# Function to fetch WMS data
def fetch_wms_data(wms_url):
    try:
        response = requests.get(wms_url)
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch WMS data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch WMS data")

# Function to transform coordinates to EPSG:3857
def transform_coordinates(x, y):
    transformer = Transformer.from_crs("epsg:2056", "epsg:3857", always_xy=True)
    return transformer.transform(x, y)

# Endpoint to get trajectories and journeys based on bounding box
@app.get("/get_all_journey/")
async def get_all_journey(
    bbox: str = Query(..., description="Bounding box coordinates in format easting,northing,easting,northing"),
    key: str = Query(..., description="API key"),
    zoom: int = Query(12, description="Zoom level")
):
    # Construct API URL with dynamic bounding box and provided API key
    api_url = f"https://api.geops.io/tracker-http/v1/trajectories/sbb/?bbox={bbox}&key={key}&zoom={zoom}"
    print(f"Constructed API URL: {api_url}")  # Log the constructed URL

    # Fetch GeoJSON data from external API
    trajectories_geojson = fetch_geojson_from_external_api(api_url)

    # Ensure we have a valid FeatureCollection
    if trajectories_geojson.get("type") != "FeatureCollection" or not isinstance(trajectories_geojson.get("features"), list):
        raise HTTPException(status_code=500, detail="Invalid GeoJSON data received from external API")

    # Get journeys and calls for each train ID in trajectories_geojson
    for feature in trajectories_geojson["features"]:
        properties = feature.get("properties", {})
        train_id = properties.get("train_id")
        train_type = properties.get("type")

        if train_id and train_type != "gondola":
            # Fetch journeys for train ID
            journeys_geojson = fetch_journeys_for_train_id(train_id, key)
            properties["journeys"] = journeys_geojson.get("features", [])

            # Fetch calls for train ID
            calls_geojson = fetch_calls_for_train_id(train_id, key)
            properties["calls"] = calls_geojson.get("features", [])

    # Return fetched GeoJSON data
    return trajectories_geojson

# Endpoint to get WMS data and transform to EPSG:3857
@app.get("/get_wms/")
async def get_wms(
    bbox: str = Query(..., description="Bounding box coordinates in format minx,miny,maxx,maxy"),
    layers: str = Query(..., description="Comma-separated list of layers"),
    srs: str = Query("EPSG:2056", description="Spatial Reference System"),
    width: int = Query(256, description="Width of the image in pixels"),
    height: int = Query(256, description="Height of the image in pixels"),
    format: str = Query("image/png", description="Image format")
):
    # Construct WMS URL
    wms_url = (
        f"http://your_geoserver_url/geoserver/ows?"
        f"SERVICE=WMS&REQUEST=GetMap"
        f"&BBOX={bbox}&SRS={srs}&LAYERS={layers}&WIDTH={width}&HEIGHT={height}&FORMAT={format}"
    )
    print(f"Constructed WMS URL: {wms_url}")

    # Fetch WMS data
    wms_data = fetch_wms_data(wms_url)

    # Convert coordinates to EPSG:3857
    transformed_wms_data = transform_coordinates(wms_data)

    # Return transformed WMS data
    return Response(content=transformed_wms_data, media_type=format)

# Endpoint to get calls based on train ID
@app.get("/get_info/")
async def get_info(train_id: str = Query(..., description="Train ID"), key: str = Query(..., description="API key")):
    # Construct API URL with provided train ID and API key
    api_url = f"https://api.geops.io/tracker-http/v1/calls/{train_id}/?key={key}"
    print(f"Constructed API URL for get_info: {api_url}")  # Log the constructed URL

    # Fetch GeoJSON data from external API
    calls_geojson = fetch_geojson_from_external_api(api_url)

    # Return fetched GeoJSON data
    return calls_geojson

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
