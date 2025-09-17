export interface Airport {
  _id: string;
  code: string;
  iataCode?: string; // Added for compatibility
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export interface Airline {
  _id: string;
  name: string;
  code: string;
  country: string;
  logo?: string;
  isActive?: boolean;
}

export interface Seat {
  seatNumber: string;
  class: 'economy' | 'business' | 'first';
  isAvailable: boolean;
  price: number;
}

export interface Flight {
  _id: string;
  flightNumber: string;
  airline: Airline;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // in minutes
  aircraft: {
    model: string;
    capacity: number;
  };
  seats: Seat[];
  basePrice: {
    economy: number;
    business: number;
    first: number;
  };
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'delayed';
  gate?: string;
  terminal?: string;
  baggage: {
    carryOn: {
      maxWeight: number;
      maxDimensions: string;
    };
    checked: {
      included: number;
      maxWeight: number;
      extraBagPrice: number;
    };
  };
  services: {
    meal: boolean;
    wifi: boolean;
    entertainment: boolean;
    extraLegroom: boolean;
  };
  isActive: boolean;
}

export interface FlightSearchRequest {
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class?: 'economy' | 'business' | 'first';
}

export interface FlightSearchResponse {
  success: boolean;
  message?: string;
  data?: {
    flights: Flight[];
    count?: number;
  };
  flights?: Flight[]; // For backward compatibility
  totalCount?: number;
}

export interface AirportSearchResponse {
  success: boolean;
  message?: string;
  data: {
    airports: Airport[];
    count?: number;
  };
}

export interface TripOption {
  outboundFlight: Flight;
  returnFlight?: Flight;
  totalPrice: number;
  totalDuration: number;
  stops: number;
}