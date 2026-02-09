import axios from "axios";
import { AppError } from "../config/ErrorHandler";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  address: string;
  coordinates: Coordinates;
  displayName: string;
}

export class GeolocationService {
  private readonly baseUrl = "https://nominatim.openstreetmap.org";
  private readonly userAgent = "EcommerceApp/1.0";

  async geocodeAddress(address: string): Promise<Coordinates> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: address,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.data || response.data.length === 0) {
        throw new AppError("Endereço não encontrado", 404);
      }

      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppError(
          `Erro ao geocodificar endereço: ${error.message}`,
          500,
        );
      }
      throw error;
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<LocationInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          format: "json",
        },
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.data) {
        throw new AppError("Localização não encontrada", 404);
      }

      const result = response.data;
      return {
        address:
          result.address?.road ||
          result.address?.suburb ||
          "Endereço não disponível",
        coordinates,
        displayName: result.display_name,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AppError(`Erro ao obter endereço: ${error.message}`, 500);
      }
      throw error;
    }
  }

  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const EARTH_RADIUS_KM = 6371;
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);
    const deltaLat = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  findNearbyDeliveryPersons(
    deliveryPersons: Array<{
      id: number;
      latitude?: number;
      longitude?: number;
    }>,
    targetLocation: Coordinates,
    maxDistanceKm: number = 10,
  ): Array<{ id: number; distance: number }> {
    const nearby: Array<{ id: number; distance: number }> = [];

    for (const person of deliveryPersons) {
      if (person.latitude && person.longitude) {
        const personCoords: Coordinates = {
          latitude: person.latitude,
          longitude: person.longitude,
        };

        const distance = this.calculateDistance(targetLocation, personCoords);

        if (distance <= maxDistanceKm) {
          nearby.push({ id: person.id, distance });
        }
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }
  estimateDeliveryTime(
    distanceKm: number,
    trafficFactor: number = 1.0,
  ): number {
    const averageSpeedKmh = 30;
    const handlingTimeMinutes = 15;

    const travelTimeMinutes =
      (distanceKm / averageSpeedKmh) * 60 * trafficFactor;
    return Math.round(travelTimeMinutes + handlingTimeMinutes);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
