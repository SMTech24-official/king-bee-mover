import axios, { AxiosResponse } from 'axios';


// Distance calculation utils function start from here
interface Coordinates {
  lat: number;
  lon: number;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  place_id: number;
}

class GeocodingError extends Error {
  public address: string;
  
  constructor(message: string, address: string) {
    super(message);
    this.name = 'GeocodingError';
    this.address = address;
  }
}

async function geocodeAddress(address: string): Promise<Coordinates> {
  const geocodeUrl = 'https://nominatim.openstreetmap.org/search';
  
  try {
    // Add delay to respect rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response: AxiosResponse<NominatimResponse[]> = await axios.get(geocodeUrl, {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'YourAppName/1.0'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new GeocodingError(`No results found for address: ${address}`, address);
    }

    return {
      lat: parseFloat(response.data[0].lat),
      lon: parseFloat(response.data[0].lon)
    };
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      throw new GeocodingError(
        `Failed to geocode address: ${error.message}`,
        address
      );
    }
    throw new GeocodingError('Unknown error during geocoding', address);
  }
}

async function calculateDistance(address1: string, address2: string): Promise<number> {
  try {
    // Validate inputs
    if (!address1 || !address2) {
      throw new Error('Both addresses must be provided');
    }

    // Geocode both addresses
    const coord1 = await geocodeAddress(address1);
    const coord2 = await geocodeAddress(address2);

    const distance: number = haversineDistance(coord1, coord2);
    
    return Number(distance.toFixed(2)); // Return with 2 decimal places
  } catch (error) {
    if (error instanceof GeocodingError) {
      console.error(`Geocoding error for address: ${error.address}`);
    }
    throw error;
  }
}

function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R: number = 6371; // Earth's radius in kilometers
  
  const dLat: number = toRadian(coord2.lat - coord1.lat);
  const dLon: number = toRadian(coord2.lon - coord1.lon);
  
  const lat1: number = toRadian(coord1.lat);
  const lat2: number = toRadian(coord2.lat);
  
  const a: number = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRadian(degree: number): number {
  return degree * Math.PI / 180;
}

// Distance calculation utils function end from here





export const TripUtils = {
    calculateDistance
}
