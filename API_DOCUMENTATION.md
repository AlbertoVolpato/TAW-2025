# API Documentation - Flight Booking System

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.flightbooking.com/api
```

## Authentication

Tutte le API protette richiedono un token JWT nell'header Authorization:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

Tutte le API seguono un formato di risposta consistente:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid request data |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource already exists |
| 422  | Unprocessable Entity - Validation error |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

---

# Authentication Endpoints

## Register User

**POST** `/auth/register`

Registra un nuovo utente nel sistema.

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user" // Optional: "user", "airline", "admin"
}
```

### Validation Rules
- **email**: Valid email format, unique
- **password**: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- **firstName**: 2-50 characters
- **lastName**: 2-50 characters
- **role**: Optional, defaults to "user"

### Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses
```json
// Email already exists
{
  "success": false,
  "message": "Email already registered"
}

// Validation error
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Password must contain at least one uppercase letter"
  ]
}
```

---

## Login User

**POST** `/auth/login`

Autentica un utente esistente.

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses
```json
// Invalid credentials
{
  "success": false,
  "message": "Invalid credentials"
}

// Account inactive
{
  "success": false,
  "message": "Account is inactive"
}
```

---

## Get Current User

**GET** `/auth/me`

🔒 **Requires Authentication**

Ottiene le informazioni dell'utente corrente.

### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "profile": {
        "phone": "+39 123 456 7890",
        "dateOfBirth": "1990-01-01",
        "nationality": "IT"
      },
      "preferences": {
        "seatPreference": "window",
        "language": "it"
      }
    }
  }
}
```

---

# Flight Endpoints

## Search Flights

**GET** `/flights/search`

Cerca voli disponibili con filtri avanzati.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| origin | string | Yes | Codice aeroporto di partenza (es. FCO) |
| destination | string | Yes | Codice aeroporto di destinazione (es. MXP) |
| departureDate | string | Yes | Data partenza (YYYY-MM-DD) |
| returnDate | string | No | Data ritorno (YYYY-MM-DD) |
| passengers | number | No | Numero passeggeri (default: 1) |
| class | string | No | Classe di viaggio (economy/business/first) |
| maxPrice | number | No | Prezzo massimo |
| airline | string | No | Codice compagnia aerea |
| directOnly | boolean | No | Solo voli diretti |

### Example Request
```http
GET /api/flights/search?origin=FCO&destination=MXP&departureDate=2024-12-25&passengers=2&class=economy
```

### Response
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "flightNumber": "AZ123",
        "airline": {
          "id": "64a1b2c3d4e5f6789012346",
          "name": "Alitalia",
          "code": "AZ",
          "logo": "https://example.com/alitalia-logo.png"
        },
        "route": {
          "origin": {
            "code": "FCO",
            "name": "Leonardo da Vinci International Airport",
            "city": "Rome",
            "country": "Italy"
          },
          "destination": {
            "code": "MXP",
            "name": "Milan Malpensa Airport",
            "city": "Milan",
            "country": "Italy"
          },
          "distance": 477
        },
        "schedule": {
          "departure": "2024-12-25T08:00:00Z",
          "arrival": "2024-12-25T09:30:00Z",
          "duration": 90
        },
        "pricing": {
          "economy": 150,
          "business": 350
        },
        "availability": {
          "economy": 120,
          "business": 20
        },
        "status": "scheduled",
        "aircraft": {
          "model": "Airbus A320",
          "manufacturer": "Airbus"
        }
      }
    ],
    "count": 1,
    "searchCriteria": {
      "origin": "FCO",
      "destination": "MXP",
      "departureDate": "2024-12-25",
      "passengers": 2,
      "class": "economy"
    }
  }
}
```

---

## Get Flight Details

**GET** `/flights/{flightId}`

Ottiene i dettagli completi di un volo specifico.

### Path Parameters
- **flightId**: ID del volo

### Response
```json
{
  "success": true,
  "data": {
    "flight": {
      "id": "64a1b2c3d4e5f6789012345",
      "flightNumber": "AZ123",
      "airline": {
        "id": "64a1b2c3d4e5f6789012346",
        "name": "Alitalia",
        "code": "AZ",
        "logo": "https://example.com/alitalia-logo.png"
      },
      "route": {
        "origin": {
          "code": "FCO",
          "name": "Leonardo da Vinci International Airport",
          "city": "Rome",
          "country": "Italy",
          "timezone": "Europe/Rome"
        },
        "destination": {
          "code": "MXP",
          "name": "Milan Malpensa Airport",
          "city": "Milan",
          "country": "Italy",
          "timezone": "Europe/Rome"
        },
        "distance": 477
      },
      "schedule": {
        "departure": "2024-12-25T08:00:00Z",
        "arrival": "2024-12-25T09:30:00Z",
        "duration": 90
      },
      "pricing": {
        "economy": 150,
        "business": 350
      },
      "availability": {
        "economy": 120,
        "business": 20
      },
      "status": "scheduled",
      "gate": "A12",
      "terminal": "1",
      "aircraft": {
        "id": "64a1b2c3d4e5f6789012347",
        "model": "Airbus A320",
        "manufacturer": "Airbus",
        "capacity": {
          "economy": 150,
          "business": 20
        }
      },
      "services": {
        "wifi": true,
        "meals": true,
        "entertainment": true
      }
    }
  }
}
```

---

## Create Flight

**POST** `/flights`

🔒 **Requires Authentication** (Admin/Airline role)

Crea un nuovo volo.

### Request Body
```json
{
  "flightNumber": "AZ456",
  "airline": "64a1b2c3d4e5f6789012346",
  "aircraft": "64a1b2c3d4e5f6789012347",
  "route": {
    "origin": "64a1b2c3d4e5f6789012348",
    "destination": "64a1b2c3d4e5f6789012349"
  },
  "schedule": {
    "departure": "2024-12-26T10:00:00Z",
    "arrival": "2024-12-26T11:30:00Z"
  },
  "pricing": {
    "economy": 180,
    "business": 400
  },
  "gate": "B5",
  "terminal": "2"
}
```

### Response
```json
{
  "success": true,
  "message": "Flight created successfully",
  "data": {
    "flight": {
      "id": "64a1b2c3d4e5f678901234a",
      "flightNumber": "AZ456",
      "status": "scheduled",
      // ... other flight details
    }
  }
}
```

---

# Booking Endpoints

## Create Booking

**POST** `/bookings`

🔒 **Requires Authentication**

Crea una nuova prenotazione.

### Request Body
```json
{
  "flightId": "64a1b2c3d4e5f6789012345",
  "passengers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "AB123456",
      "nationality": "IT",
      "specialRequests": ["vegetarian_meal"]
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "dateOfBirth": "1992-05-15",
      "passportNumber": "CD789012",
      "nationality": "IT"
    }
  ],
  "seatClass": "economy",
  "paymentMethod": "credit_card"
}
```

### Validation Rules
- **flightId**: Valid MongoDB ObjectId
- **passengers**: Array of 1-9 passengers
- **firstName/lastName**: 2-50 characters each
- **dateOfBirth**: Valid date, not in future
- **passportNumber**: 6-20 characters
- **nationality**: 2-letter country code
- **seatClass**: "economy", "business", or "first"
- **paymentMethod**: "credit_card", "paypal", or "bank_transfer"

### Response
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "64a1b2c3d4e5f678901234b",
      "bookingReference": "ABC123",
      "user": "64a1b2c3d4e5f6789012345",
      "flight": {
        "id": "64a1b2c3d4e5f6789012345",
        "flightNumber": "AZ123",
        "airline": {
          "name": "Alitalia",
          "code": "AZ"
        },
        "route": {
          "origin": {
            "code": "FCO",
            "name": "Leonardo da Vinci International Airport",
            "city": "Rome"
          },
          "destination": {
            "code": "MXP",
            "name": "Milan Malpensa Airport",
            "city": "Milan"
          }
        },
        "schedule": {
          "departure": "2024-12-25T08:00:00Z",
          "arrival": "2024-12-25T09:30:00Z"
        }
      },
      "passengers": [
        {
          "firstName": "John",
          "lastName": "Doe",
          "dateOfBirth": "1990-01-01",
          "passportNumber": "AB123456",
          "nationality": "IT",
          "seatClass": "economy",
          "specialRequests": ["vegetarian_meal"]
        },
        {
          "firstName": "Jane",
          "lastName": "Doe",
          "dateOfBirth": "1992-05-15",
          "passportNumber": "CD789012",
          "nationality": "IT",
          "seatClass": "economy"
        }
      ],
      "pricing": {
        "basePrice": 300,
        "taxes": 45,
        "fees": 50,
        "total": 395
      },
      "payment": {
        "method": "credit_card",
        "status": "pending"
      },
      "status": "pending",
      "createdAt": "2024-12-20T10:00:00Z"
    }
  }
}
```

### Error Responses
```json
// Flight not found
{
  "success": false,
  "message": "Flight not found"
}

// Not enough seats
{
  "success": false,
  "message": "Not enough seats available"
}

// Validation error
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Passport number must be between 6 and 20 characters"
  ]
}
```

---

## Get User Bookings

**GET** `/bookings`

🔒 **Requires Authentication**

Ottiene tutte le prenotazioni dell'utente corrente.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filtra per status (pending/confirmed/cancelled/completed) |
| page | number | Numero pagina (default: 1) |
| limit | number | Elementi per pagina (default: 10, max: 50) |
| sortBy | string | Campo per ordinamento (createdAt/departure) |
| sortOrder | string | Ordine (asc/desc, default: desc) |

### Example Request
```http
GET /api/bookings?status=confirmed&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Response
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "64a1b2c3d4e5f678901234b",
        "bookingReference": "ABC123",
        "flight": {
          "flightNumber": "AZ123",
          "airline": {
            "name": "Alitalia",
            "code": "AZ"
          },
          "route": {
            "origin": {
              "code": "FCO",
              "city": "Rome"
            },
            "destination": {
              "code": "MXP",
              "city": "Milan"
            }
          },
          "schedule": {
            "departure": "2024-12-25T08:00:00Z",
            "arrival": "2024-12-25T09:30:00Z"
          }
        },
        "passengers": [
          {
            "firstName": "John",
            "lastName": "Doe",
            "seatNumber": "12A"
          }
        ],
        "pricing": {
          "total": 395
        },
        "status": "confirmed",
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Get Booking Details

**GET** `/bookings/{bookingId}`

🔒 **Requires Authentication**

Ottiene i dettagli completi di una prenotazione specifica.

### Path Parameters
- **bookingId**: ID della prenotazione

### Response
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "64a1b2c3d4e5f678901234b",
      "bookingReference": "ABC123",
      "user": {
        "id": "64a1b2c3d4e5f6789012345",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "flight": {
        "id": "64a1b2c3d4e5f6789012345",
        "flightNumber": "AZ123",
        "airline": {
          "name": "Alitalia",
          "code": "AZ",
          "logo": "https://example.com/alitalia-logo.png"
        },
        "route": {
          "origin": {
            "code": "FCO",
            "name": "Leonardo da Vinci International Airport",
            "city": "Rome",
            "country": "Italy"
          },
          "destination": {
            "code": "MXP",
            "name": "Milan Malpensa Airport",
            "city": "Milan",
            "country": "Italy"
          }
        },
        "schedule": {
          "departure": "2024-12-25T08:00:00Z",
          "arrival": "2024-12-25T09:30:00Z",
          "duration": 90
        },
        "gate": "A12",
        "terminal": "1",
        "status": "scheduled"
      },
      "passengers": [
        {
          "firstName": "John",
          "lastName": "Doe",
          "dateOfBirth": "1990-01-01",
          "passportNumber": "AB123456",
          "nationality": "IT",
          "seatNumber": "12A",
          "seatClass": "economy",
          "specialRequests": ["vegetarian_meal"]
        }
      ],
      "pricing": {
        "basePrice": 300,
        "taxes": 45,
        "fees": 50,
        "total": 395
      },
      "payment": {
        "method": "credit_card",
        "status": "completed",
        "transactionId": "txn_123456789",
        "paidAt": "2024-12-20T10:05:00Z"
      },
      "status": "confirmed",
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:05:00Z"
    }
  }
}
```

---

## Cancel Booking

**DELETE** `/bookings/{bookingId}`

🔒 **Requires Authentication**

Cancella una prenotazione esistente.

### Path Parameters
- **bookingId**: ID della prenotazione

### Response
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "id": "64a1b2c3d4e5f678901234b",
      "bookingReference": "ABC123",
      "status": "cancelled",
      "cancelledAt": "2024-12-20T15:30:00Z",
      "refund": {
        "amount": 355.5,
        "fee": 39.5,
        "status": "processing"
      }
    }
  }
}
```

### Error Responses
```json
// Booking not found or not owned by user
{
  "success": false,
  "message": "Booking not found"
}

// Cannot cancel (flight already departed)
{
  "success": false,
  "message": "Cannot cancel booking for departed flights"
}

// Already cancelled
{
  "success": false,
  "message": "Booking is already cancelled"
}
```

---

# Airport Endpoints

## Get All Airports

**GET** `/airports`

Ottiene la lista di tutti gli aeroporti disponibili.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Cerca per nome, città o codice |
| country | string | Filtra per paese (codice ISO) |
| limit | number | Numero massimo risultati (default: 100) |

### Example Request
```http
GET /api/airports?search=milan&limit=10
```

### Response
```json
{
  "success": true,
  "data": {
    "airports": [
      {
        "id": "64a1b2c3d4e5f6789012348",
        "code": "MXP",
        "name": "Milan Malpensa Airport",
        "city": "Milan",
        "country": "Italy",
        "timezone": "Europe/Rome",
        "coordinates": {
          "latitude": 45.6306,
          "longitude": 8.7281
        }
      },
      {
        "id": "64a1b2c3d4e5f6789012349",
        "code": "LIN",
        "name": "Milan Linate Airport",
        "city": "Milan",
        "country": "Italy",
        "timezone": "Europe/Rome",
        "coordinates": {
          "latitude": 45.4454,
          "longitude": 9.2767
        }
      }
    ],
    "count": 2
  }
}
```

---

# Airline Endpoints

## Get All Airlines

**GET** `/airlines`

Ottiene la lista di tutte le compagnie aeree.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| active | boolean | Filtra per compagnie attive (default: true) |
| country | string | Filtra per paese |

### Response
```json
{
  "success": true,
  "data": {
    "airlines": [
      {
        "id": "64a1b2c3d4e5f6789012346",
        "code": "AZ",
        "name": "Alitalia",
        "country": "Italy",
        "logo": "https://example.com/alitalia-logo.png",
        "isActive": true
      },
      {
        "id": "64a1b2c3d4e5f678901234c",
        "code": "BA",
        "name": "British Airways",
        "country": "United Kingdom",
        "logo": "https://example.com/ba-logo.png",
        "isActive": true
      }
    ],
    "count": 2
  }
}
```

---

# User Management Endpoints

## Update User Profile

**PUT** `/users/profile`

🔒 **Requires Authentication**

Aggiorna il profilo dell'utente corrente.

### Request Body
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "profile": {
    "phone": "+39 123 456 7890",
    "dateOfBirth": "1990-01-01",
    "nationality": "IT",
    "passportNumber": "AB123456"
  },
  "preferences": {
    "seatPreference": "window",
    "mealPreference": "vegetarian",
    "language": "it"
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "john.smith@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "user",
      "profile": {
        "phone": "+39 123 456 7890",
        "dateOfBirth": "1990-01-01",
        "nationality": "IT",
        "passportNumber": "AB123456"
      },
      "preferences": {
        "seatPreference": "window",
        "mealPreference": "vegetarian",
        "language": "it"
      },
      "updatedAt": "2024-12-20T16:00:00Z"
    }
  }
}
```

---

## Change Password

**PUT** `/users/password`

🔒 **Requires Authentication**

Cambia la password dell'utente corrente.

### Request Body
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

### Response
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error Responses
```json
// Current password incorrect
{
  "success": false,
  "message": "Current password is incorrect"
}

// Passwords don't match
{
  "success": false,
  "message": "New passwords do not match"
}

// Weak password
{
  "success": false,
  "message": "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
}
```

---

# Admin Endpoints

## Get All Users

**GET** `/admin/users`

🔒 **Requires Authentication** (Admin role)

Ottiene la lista di tutti gli utenti (solo admin).

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | Filtra per ruolo (user/airline/admin) |
| active | boolean | Filtra per utenti attivi |
| page | number | Numero pagina (default: 1) |
| limit | number | Elementi per pagina (default: 20) |
| search | string | Cerca per nome o email |

### Response
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "emailVerified": true,
        "createdAt": "2024-12-01T10:00:00Z",
        "lastLogin": "2024-12-20T09:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

---

## Get Booking Statistics

**GET** `/admin/statistics/bookings`

🔒 **Requires Authentication** (Admin role)

Ottiene statistiche sulle prenotazioni.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Data inizio periodo (YYYY-MM-DD) |
| endDate | string | Data fine periodo (YYYY-MM-DD) |
| groupBy | string | Raggruppa per (day/week/month) |

### Response
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalBookings": 1250,
      "totalRevenue": 487500.00,
      "averageBookingValue": 390.00,
      "bookingsByStatus": {
        "confirmed": 1000,
        "pending": 150,
        "cancelled": 100
      },
      "bookingsByClass": {
        "economy": 950,
        "business": 250,
        "first": 50
      },
      "topRoutes": [
        {
          "route": "FCO-MXP",
          "bookings": 150,
          "revenue": 58500.00
        },
        {
          "route": "MXP-LHR",
          "bookings": 120,
          "revenue": 72000.00
        }
      ],
      "dailyBookings": [
        {
          "date": "2024-12-01",
          "bookings": 45,
          "revenue": 17550.00
        },
        {
          "date": "2024-12-02",
          "bookings": 52,
          "revenue": 20280.00
        }
      ]
    }
  }
}
```

---

# Rate Limiting

Il sistema implementa rate limiting per prevenire abusi:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 attempts | 15 minutes |
| Search | 30 requests | 1 minute |
| Booking Creation | 10 requests | 5 minutes |

### Rate Limit Headers

Ogni risposta include header informativi:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 300
}
```

---

# Error Handling

## Common Error Codes

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters long"
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 422 - Unprocessable Entity
```json
{
  "success": false,
  "message": "Invalid flight data",
  "errors": [
    "Departure date cannot be in the past",
    "Arrival time must be after departure time"
  ]
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "requestId": "req_123456789"
}
```

---

# Webhooks

## Booking Status Updates

Il sistema può inviare webhook per aggiornamenti di stato delle prenotazioni.

### Webhook Payload
```json
{
  "event": "booking.status_changed",
  "timestamp": "2024-12-20T16:30:00Z",
  "data": {
    "bookingId": "64a1b2c3d4e5f678901234b",
    "bookingReference": "ABC123",
    "oldStatus": "pending",
    "newStatus": "confirmed",
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "email": "user@example.com"
    },
    "flight": {
      "flightNumber": "AZ123",
      "departure": "2024-12-25T08:00:00Z"
    }
  }
}
```

### Webhook Security

I webhook includono una signature HMAC nell'header `X-Webhook-Signature` per verificare l'autenticità.

---

# SDK Examples

## JavaScript/Node.js

```javascript
const axios = require('axios');

class FlightBookingAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async searchFlights(params) {
    try {
      const response = await this.client.get('/flights/search', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  }

  async createBooking(bookingData) {
    try {
      const response = await this.client.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Booking failed');
    }
  }

  async getUserBookings(params = {}) {
    try {
      const response = await this.client.get('/bookings', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get bookings');
    }
  }
}

// Usage
const api = new FlightBookingAPI('http://localhost:3000/api', 'your-jwt-token');

// Search flights
const flights = await api.searchFlights({
  origin: 'FCO',
  destination: 'MXP',
  departureDate: '2024-12-25',
  passengers: 2
});

// Create booking
const booking = await api.createBooking({
  flightId: '64a1b2c3d4e5f6789012345',
  passengers: [{
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    passportNumber: 'AB123456',
    nationality: 'IT'
  }],
  seatClass: 'economy',
  paymentMethod: 'credit_card'
});
```

## Python

```python
import requests
from typing import Dict, List, Optional

class FlightBookingAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def search_flights(self, **params) -> Dict:
        response = requests.get(
            f'{self.base_url}/flights/search',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def create_booking(self, booking_data: Dict) -> Dict:
        response = requests.post(
            f'{self.base_url}/bookings',
            headers=self.headers,
            json=booking_data
        )
        response.raise_for_status()
        return response.json()
    
    def get_user_bookings(self, **params) -> Dict:
        response = requests.get(
            f'{self.base_url}/bookings',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage
api = FlightBookingAPI('http://localhost:3000/api', 'your-jwt-token')

# Search flights
flights = api.search_flights(
    origin='FCO',
    destination='MXP',
    departureDate='2024-12-25',
    passengers=2
)

# Create booking
booking = api.create_booking({
    'flightId': '64a1b2c3d4e5f6789012345',
    'passengers': [{
        'firstName': 'John',
        'lastName': 'Doe',
        'dateOfBirth': '1990-01-01',
        'passportNumber': 'AB123456',
        'nationality': 'IT'
    }],
    'seatClass': 'economy',
    'paymentMethod': 'credit_card'
})
```

---

# Testing

## Postman Collection

È disponibile una collection Postman completa con tutti gli endpoint e esempi di richieste.

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000/api",
  "authToken": "{{token}}",
  "userId": "{{userId}}",
  "flightId": "{{flightId}}",
  "bookingId": "{{bookingId}}"
}
```

## cURL Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Search Flights
```bash
curl -X GET "http://localhost:3000/api/flights/search?origin=FCO&destination=MXP&departureDate=2024-12-25&passengers=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "flightId": "64a1b2c3d4e5f6789012345",
    "passengers": [{
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "AB123456",
      "nationality": "IT"
    }],
    "seatClass": "economy",
    "paymentMethod": "credit_card"
  }'
```

---

# Changelog

## Version 1.0.0 (2024-12-20)
- Initial API release
- Authentication endpoints
- Flight search and management
- Booking system
- User management
- Admin endpoints
- Rate limiting
- Comprehensive error handling

---

# Support

Per supporto tecnico o domande sull'API:

- **Email**: api-support@flightbooking.com
- **Documentation**: https://docs.flightbooking.com
- **Status Page**: https://status.flightbooking.com
- **GitHub Issues**: https://github.com/flightbooking/api/issues

---

*Questa documentazione è aggiornata alla versione 1.0.0 dell'API. Per la versione più recente, consultare sempre la documentazione online.*