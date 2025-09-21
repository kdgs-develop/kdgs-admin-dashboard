"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode
} from "react";
import { Prisma } from "@prisma/client";
import { getCities, getCountries } from "./actions";

type CityWithCountry = Prisma.CityGetPayload<{ include: { country: true } }>;
type Country = { id: number; name: string };

interface SharedDataContextType {
  // Data
  cities: CityWithCountry[];
  countries: Country[];

  // Formatted data for compatibility with existing components
  formattedCities: {
    id: number;
    name: string;
    province?: string | null;
    country: { name: string };
  }[];

  // Loading states
  isCitiesLoading: boolean;
  isCountriesLoading: boolean;

  // Refresh functions
  refreshCities: () => Promise<void>;
  refreshCountries: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Initialization
  isInitialized: boolean;
  initializeData: () => Promise<void>;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(
  undefined
);

export function useSharedData() {
  const context = useContext(SharedDataContext);
  if (context === undefined) {
    throw new Error("useSharedData must be used within a SharedDataProvider");
  }
  return context;
}

interface SharedDataProviderProps {
  children: ReactNode;
}

export function SharedDataProvider({ children }: SharedDataProviderProps) {
  const [cities, setCities] = useState<CityWithCountry[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  // Compute formatted cities for compatibility
  const formattedCities = cities
    .filter(city => city.country) // Only include cities with countries
    .map(city => ({
      id: city.id,
      name: city.name || "",
      province: city.province,
      country: { name: city.country!.name }
    }));
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshCities = useCallback(async () => {
    setIsCitiesLoading(true);
    try {
      const citiesData = await getCities();
      setCities(citiesData);
    } catch (error) {
      console.error("Error refreshing cities:", error);
      throw error;
    } finally {
      setIsCitiesLoading(false);
    }
  }, []);

  const refreshCountries = useCallback(async () => {
    setIsCountriesLoading(true);
    try {
      const countriesResult = await getCountries(1, 1000);
      setCountries(countriesResult.countries);
    } catch (error) {
      console.error("Error refreshing countries:", error);
      throw error;
    } finally {
      setIsCountriesLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCities(), refreshCountries()]);
  }, [refreshCities, refreshCountries]);

  const initializeData = useCallback(async () => {
    if (isInitialized) return;

    try {
      await refreshAll();
      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing shared data:", error);
      throw error;
    }
  }, [isInitialized, refreshAll]);

  const value: SharedDataContextType = {
    cities,
    countries,
    formattedCities,
    isCitiesLoading,
    isCountriesLoading,
    refreshCities,
    refreshCountries,
    refreshAll,
    isInitialized,
    initializeData
  };

  return (
    <SharedDataContext.Provider value={value}>
      {children}
    </SharedDataContext.Provider>
  );
}
