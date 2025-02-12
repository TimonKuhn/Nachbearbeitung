from fastapi import FastAPI, Query, HTTPException
import requests
from functools import lru_cache
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()

# CORS middleware to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1234"],  # Adjusted to match your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Endpoint to get trajectories and journeys based on bounding box
@app.get("/get_all_journey/")
async def get_all_journey(
    bbox: str = Query(..., description="Bounding box coordinates in format easting,northing,easting,northing"),
    key: str = Query(..., description="API key"),
    zoom: int = Query(12, description="Zoom level")
):
    api_url = f"https://api.geops.io/tracker-http/v1/trajectories/sbb/?bbox={bbox}&key={key}&zoom={zoom}"
    print(f"Constructed API URL: {api_url}")  # Log the constructed URL

    trajectories_geojson = fetch_geojson_from_external_api(api_url)

    if trajectories_geojson.get("type") != "FeatureCollection" or not isinstance(trajectories_geojson.get("features"), list):
        raise HTTPException(status_code=500, detail="Invalid GeoJSON data received from external API")

    for feature in trajectories_geojson["features"]:
        properties = feature.get("properties", {})
        train_id = properties.get("train_id")
        train_type = properties.get("type")

        if train_id and train_type != "gondola":
            journeys_geojson = fetch_journeys_for_train_id(train_id, key)
            properties["journeys"] = journeys_geojson.get("features", [])

    return trajectories_geojson

# Endpoint to get calls based on train ID
@app.get("/get_info/")
async def get_info(train_id: str = Query(..., description="Train ID"), key: str = Query(..., description="API key")):
    api_url = f"https://api.geops.io/tracker-http/v1/calls/{train_id}/?key={key}"
    print(f"Constructed API URL for get_info: {api_url}")  # Log the constructed URL

    calls_geojson = fetch_geojson_from_external_api(api_url)

    return calls_geojson

# Define the new endpoint for the WFS request
@app.get("/wfs/")
async def get_wfs_data(
    bbox: str = Query(..., description="Bounding box coordinates in format easting,northing,easting,northing")):
    print("wfs requested")
    wfs_url = "http://localhost:8080/geoserver/wfs"
    params = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "GetFeature",
        "typeName": "ne:magosm_railways_line",
        "outputFormat": "application/json",
        "srsname": "EPSG:3857",
        "bbox": bbox
    }

    try:
        response = requests.get(wfs_url, params=params)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error accessing GeoServer: {str(e)}")
    
    return StreamingResponse(response.iter_content(chunk_size=128), media_type="application/json")

# Endpoint to get WMS image from GeoServer
@app.get("/wms/")
def get_wms(layers: str = Query(..., alias="LAYERS"),
            bbox: str = Query(..., alias="BBOX"),
            width: int = Query(..., alias="WIDTH"),
            height: int = Query(..., alias="HEIGHT")):
    print("wms requested")

    wms_url = "http://localhost:8080/geoserver/wms"
    params = {
        "service": "WMS",
        "version": "1.1.1",
        "request": "GetMap",
        "layers": layers,
        "bbox": bbox,
        "width": width,
        "height": height,
        "srs": "EPSG:3857",
        "format": "image/png",
        "transparent": "true"
    }

    try:
        response = requests.get(wms_url, params=params, stream=True)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error accessing GeoServer: {str(e)}")
    
    return StreamingResponse(response.iter_content(chunk_size=128), media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
