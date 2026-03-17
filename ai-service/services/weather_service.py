import os
import httpx
from utils.logger import logger

TOMORROW_API_KEY = os.getenv("TOMORROW_API_KEY", "your_tomorrow_io_api_key_here")

def get_weather_data(location_name):
    """
    Fetch weather data from Tomorrow.io.
    Returns rain intensity in mm/hr.
    """
    # Fallback to mock data if API key is not configured or in dev mode
    if TOMORROW_API_KEY == "your_tomorrow_io_api_key_here" or os.getenv("APP_MODE") == "dev":
        # Simulate some rain for specific cities or just return a default
        logger.info({"event": "weather_mock_used", "location": location_name})
        if "Hyderabad" in location_name or "Chennai" in location_name:
            return 2.5 # Simulated rain
        return 0.0

    url = f"https://api.tomorrow.io/v4/weather/realtime?location={location_name}&apikey={TOMORROW_API_KEY}"
    headers = {"accept": "application/json"}

    try:
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Tomorrow.io realtime API structure:
            # data['data']['values']['rainIntensity']
            rain_intensity = data.get('data', {}).get('values', {}).get('rainIntensity', 0.0)
            
            logger.info({
                "event": "weather_data_fetched", 
                "location": location_name, 
                "rain_intensity": rain_intensity
            })
            return rain_intensity
            
    except Exception as e:
        logger.error({"event": "weather_api_error", "location": location_name, "error": str(e)})
        # Return 0.0 on error to avoid false payouts, or fallback to mock in dev
        if os.getenv("APP_MODE") == "dev":
             return 2.5 # Mock rain on API error for dev testing
        return 0.0
