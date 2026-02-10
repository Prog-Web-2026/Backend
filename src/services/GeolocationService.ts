import { AppError } from "../config/ErrorHandler";
import { UserAddress } from "../models/UserModel";

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
  private readonly reverseCache = new Map<string, string>();

  formatUserAddress(address: UserAddress): string {
    const parts = [
      address.street,
      address.number,
      address.neighborhood,
      address.city,
      address.state,
      address.zipCode,
      address.country || "Brasil",
    ];

    return parts.filter(Boolean).join(", ");
  }

  async geocodeUserAddress(address: UserAddress): Promise<Coordinates> {
    return this.geocodeAddress(this.formatUserAddress(address));
  }

  async geocodeAddress(address: string): Promise<Coordinates> {
    if (!address || address.trim().length < 5) {
      throw new AppError("Endereço inválido", 400);
    }

    const normalized = this.normalizeAddress(address);

    const seed = this.hashStringToInt(normalized);

    // Base São Paulo
    const baseLat = -23.55052;
    const baseLon = -46.633308;

    const maxOffsetKm = 20;

    const offsetLatKm = this.randomFromSeed(seed, 1) * maxOffsetKm;
    const offsetLonKm = this.randomFromSeed(seed, 2) * maxOffsetKm;

    const latSign = this.randomFromSeed(seed, 3) > 0.5 ? 1 : -1;
    const lonSign = this.randomFromSeed(seed, 4) > 0.5 ? 1 : -1;

    const latitude = baseLat + this.kmToLatitudeDegrees(offsetLatKm * latSign);
    const longitude =
      baseLon + this.kmToLongitudeDegrees(offsetLonKm * lonSign, baseLat);

    const coords: Coordinates = {
      latitude: this.round(latitude, 6),
      longitude: this.round(longitude, 6),
    };

    this.reverseCache.set(this.buildKey(coords), address);

    return coords;
  }

  async reverseGeocode(coordinates: Coordinates): Promise<LocationInfo> {
    if (
      coordinates.latitude == null ||
      coordinates.longitude == null ||
      Number.isNaN(coordinates.latitude) ||
      Number.isNaN(coordinates.longitude)
    ) {
      throw new AppError("Coordenadas inválidas", 400);
    }

    const coords: Coordinates = {
      latitude: this.round(coordinates.latitude, 6),
      longitude: this.round(coordinates.longitude, 6),
    };

    const key = this.buildKey(coords);

    const cachedAddress = this.reverseCache.get(key);

    if (!cachedAddress) {
      throw new AppError("Localização não encontrada", 404);
    }

    return {
      address: cachedAddress,
      coordinates: coords,
      displayName: cachedAddress,
    };
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
      if (person.latitude == null || person.longitude == null) continue;

      const distance = this.calculateDistance(targetLocation, {
        latitude: person.latitude,
        longitude: person.longitude,
      });

      if (distance <= maxDistanceKm) {
        nearby.push({ id: person.id, distance });
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

  private buildKey(coordinates: Coordinates): string {
    return `${coordinates.latitude},${coordinates.longitude}`;
  }

  private normalizeAddress(address: string): string {
    return address
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  private hashStringToInt(text: string): number {
    let hash = 2166136261;

    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  private randomFromSeed(seed: number, salt: number): number {
    const x = Math.sin(seed + salt * 9999) * 10000;
    return x - Math.floor(x);
  }

  private kmToLatitudeDegrees(km: number): number {
    return km / 111;
  }

  private kmToLongitudeDegrees(km: number, latitude: number): number {
    return km / (111 * Math.cos(this.toRadians(latitude)));
  }

  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
