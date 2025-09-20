// Airline Statistics Models
export interface AirlineStats {
  period: string;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    totalFlights: number;
    averageRevenuePerDay: number;
    averageRevenuePerBooking: number;
  };
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
}

export interface AirlineRevenueStats {
  success: boolean;
  data: {
    period: string;
    dailyRevenue: DailyRevenue[];
    summary: {
      totalRevenue: number;
      totalBookings: number;
      averageRevenuePerDay: number;
      averageRevenuePerBooking: number;
    };
  };
}

export interface PassengerStats {
  success: boolean;
  data: {
    period: string;
    dailyStatistics: {
      date: string;
      passengers: number;
      bookings: number;
      flights: number;
    }[];
    summary: {
      totalPassengers: number;
      totalBookings: number;
      totalFlights: number;
      averagePassengersPerDay: number;
      averagePassengersPerFlight: number;
      loadFactor: number;
    };
  };
}

export interface PopularRoute {
  route: string;
  departureAirport: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  arrivalAirport: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  bookings: number;
  passengers: number;
  revenue: number;
  averageRevenuePerBooking: number;
}

export interface PopularRoutesStats {
  success: boolean;
  data: {
    period: string;
    routes: PopularRoute[];
  };
}

export interface AirlineInfo {
  _id: string;
  name: string;
  code: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
