import { GeolocationService } from "../services/GeolocationService";
import { AppError } from "../config/ErrorHandler";

describe("GeolocationService (Unit)", () => {
  let service: GeolocationService;

  beforeEach(() => {
    service = new GeolocationService();
  });

  describe("formatUserAddress", () => {
    it("should format user address correctly when all fields are provided", () => {
      const address = {
        street: "Av. Paulista",
        number: "1000",
        complement: "Apto 10",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
        country: "Brasil",
      };

      const formatted = service.formatUserAddress(address);

      expect(formatted).toBe(
        "Av. Paulista, 1000, Bela Vista, São Paulo, SP, 01310-100, Brasil",
      );
    });

    it("should ignore missing fields when formatting address", () => {
      const address = {
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
        country: undefined,
      };

      const formatted = service.formatUserAddress(address);

      expect(formatted).toBe(
        "Av. Paulista, 1000, Bela Vista, São Paulo, SP, 01310-100, Brasil",
      );
    });
  });

  describe("geocodeAddress", () => {
    it("should return deterministic coordinates when same address is passed twice", async () => {
      const address = "Av. Paulista, 1000, São Paulo, SP, Brasil";

      const coords1 = await service.geocodeAddress(address);
      const coords2 = await service.geocodeAddress(address);

      expect(coords1).toEqual(coords2);
    });

    it("should generate different coordinates when different addresses are passed", async () => {
      const address1 = "Av. Paulista, 1000, São Paulo, SP, Brasil";
      const address2 = "Rua Augusta, 500, São Paulo, SP, Brasil";

      const coords1 = await service.geocodeAddress(address1);
      const coords2 = await service.geocodeAddress(address2);

      expect(coords1).not.toEqual(coords2);
    });

    it("should throw AppError 400 when address is empty", async () => {
      await expect(service.geocodeAddress("")).rejects.toMatchObject({
        message: "Endereço inválido",
        statusCode: 400,
      });
    });

    it("should throw AppError 400 when address is too short", async () => {
      await expect(service.geocodeAddress("abc")).rejects.toMatchObject({
        message: "Endereço inválido",
        statusCode: 400,
      });
    });

    it("should return coordinates close to São Paulo base when valid address is passed", async () => {
      const address = "Av. Paulista, 1000, São Paulo, SP, Brasil";

      const coords = await service.geocodeAddress(address);

      expect(coords.latitude).toBeLessThan(-23.0);
      expect(coords.latitude).toBeGreaterThan(-24.0);

      expect(coords.longitude).toBeLessThan(-46.0);
      expect(coords.longitude).toBeGreaterThan(-47.5);
    });
  });

  describe("geocodeUserAddress", () => {
    it("should return coordinates when user address object is passed", async () => {
      const userAddress = {
        street: "Avenida das Nações Unidas",
        number: "12495",
        complement: "Bloco 2",
        neighborhood: "Vila Gertrudes",
        city: "São Paulo",
        state: "SP",
        zipCode: "04730-090",
        country: "Brasil",
      };

      const coords = await service.geocodeUserAddress(userAddress);

      expect(coords).toHaveProperty("latitude");
      expect(coords).toHaveProperty("longitude");

      expect(typeof coords.latitude).toBe("number");
      expect(typeof coords.longitude).toBe("number");
    });

    it("should return deterministic coordinates when same user address is passed twice", async () => {
      const userAddress = {
        street: "Avenida das Nações Unidas",
        number: "12495",
        complement: "Bloco 2",
        neighborhood: "Vila Gertrudes",
        city: "São Paulo",
        state: "SP",
        zipCode: "04730-090",
        country: "Brasil",
      };

      const coords1 = await service.geocodeUserAddress(userAddress);
      const coords2 = await service.geocodeUserAddress(userAddress);

      expect(coords1).toEqual(coords2);
    });
  });

  describe("reverseGeocode", () => {
    it("should return the same address when reverse geocoding previously geocoded coordinates", async () => {
      const address = "Av. Paulista, 1000, São Paulo, SP, Brasil";

      const coords = await service.geocodeAddress(address);
      const result = await service.reverseGeocode(coords);

      expect(result).toEqual({
        address,
        coordinates: coords,
        displayName: address,
      });
    });

    it("should throw AppError 404 when coordinates are not cached", async () => {
      await expect(
        service.reverseGeocode({ latitude: -23.55, longitude: -46.63 }),
      ).rejects.toMatchObject({
        message: "Localização não encontrada",
        statusCode: 404,
      });
    });

    it("should throw AppError 400 when latitude is invalid", async () => {
      await expect(
        service.reverseGeocode({ latitude: NaN, longitude: -46.63 }),
      ).rejects.toMatchObject({
        message: "Coordenadas inválidas",
        statusCode: 400,
      });
    });

    it("should throw AppError 400 when longitude is invalid", async () => {
      await expect(
        service.reverseGeocode({ latitude: -23.55, longitude: NaN }),
      ).rejects.toMatchObject({
        message: "Coordenadas inválidas",
        statusCode: 400,
      });
    });

    it("should throw AppError 400 when latitude is null", async () => {
      await expect(
        service.reverseGeocode({
          latitude: null as unknown as number,
          longitude: -46.63,
        }),
      ).rejects.toMatchObject({
        message: "Coordenadas inválidas",
        statusCode: 400,
      });
    });

    it("should throw AppError 400 when longitude is null", async () => {
      await expect(
        service.reverseGeocode({
          latitude: -23.55,
          longitude: null as unknown as number,
        }),
      ).rejects.toMatchObject({
        message: "Coordenadas inválidas",
        statusCode: 400,
      });
    });
  });

  describe("calculateDistance", () => {
    it("should return 0 when both coordinates are the same", () => {
      const coord = { latitude: -23.55052, longitude: -46.633308 };

      const distance = service.calculateDistance(coord, coord);

      expect(distance).toBe(0);
    });

    it("should calculate correct distance when São Paulo and Rio are passed", () => {
      const sp = { latitude: -23.55052, longitude: -46.633308 };
      const rj = { latitude: -22.906847, longitude: -43.172897 };

      const distance = service.calculateDistance(sp, rj);

      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(500);
    });
  });

  describe("findNearbyDeliveryPersons", () => {
    it("should return only delivery persons inside max distance when coordinates are valid", () => {
      const target = { latitude: -23.55052, longitude: -46.633308 };

      const deliveryPersons = [
        { id: 1, latitude: -23.551, longitude: -46.633 },
        { id: 2, latitude: -23.8, longitude: -46.9 },
        { id: 3, latitude: -23.552, longitude: -46.634 },
      ];

      const nearby = service.findNearbyDeliveryPersons(
        deliveryPersons,
        target,
        10,
      );

      expect(nearby.length).toBeGreaterThan(0);

      for (const person of nearby) {
        expect(person.distance).toBeLessThanOrEqual(10);
      }
    });

    it("should ignore delivery persons without coordinates when searching nearby", () => {
      const target = { latitude: -23.55052, longitude: -46.633308 };

      const deliveryPersons = [
        { id: 1, latitude: -23.551, longitude: -46.633 },
        { id: 2 },
        { id: 3, latitude: -23.552 },
        { id: 4, longitude: -46.634 },
      ];

      const nearby = service.findNearbyDeliveryPersons(
        deliveryPersons,
        target,
        10,
      );

      expect(nearby.find((p) => p.id === 2)).toBeUndefined();
      expect(nearby.find((p) => p.id === 3)).toBeUndefined();
      expect(nearby.find((p) => p.id === 4)).toBeUndefined();
    });

    it("should return delivery persons sorted by distance when multiple are found", () => {
      const target = { latitude: -23.55052, longitude: -46.633308 };

      const deliveryPersons = [
        { id: 1, latitude: -23.56, longitude: -46.64 },
        { id: 2, latitude: -23.551, longitude: -46.633 },
        { id: 3, latitude: -23.57, longitude: -46.65 },
      ];

      const nearby = service.findNearbyDeliveryPersons(
        deliveryPersons,
        target,
        50,
      );

      expect(nearby.length).toBeGreaterThan(1);

      for (let i = 1; i < nearby.length; i++) {
        expect(nearby[i].distance).toBeGreaterThanOrEqual(
          nearby[i - 1].distance,
        );
      }
    });

    it("should return empty array when no delivery persons are within max distance", () => {
      const target = { latitude: -23.55052, longitude: -46.633308 };

      const deliveryPersons = [
        { id: 1, latitude: -22.906847, longitude: -43.172897 },
      ];

      const nearby = service.findNearbyDeliveryPersons(
        deliveryPersons,
        target,
        10,
      );

      expect(nearby).toEqual([]);
    });
  });

  describe("estimateDeliveryTime", () => {
    it("should estimate delivery time correctly when distance is 10km", () => {
      const time = service.estimateDeliveryTime(10);

      expect(time).toBe(35);
      // 10km / 30kmh = 0.333h = 20min + 15 handling = 35min
    });

    it("should increase delivery time when traffic factor is greater than 1", () => {
      const time = service.estimateDeliveryTime(10, 2);

      expect(time).toBe(55);
      // 20min * 2 = 40 + 15 = 55
    });

    it("should return only handling time when distance is 0", () => {
      const time = service.estimateDeliveryTime(0);

      expect(time).toBe(15);
    });
  });
});
