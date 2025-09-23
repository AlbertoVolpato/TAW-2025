const mongoose = require('mongoose');

// Define the seat schema inline
const seatSchema = new mongoose.Schema({
    seatNumber: { type: String, required: true },
    class: { type: String, enum: ['economy', 'business', 'first'], required: true },
    isAvailable: { type: Boolean, default: true },
    price: { type: Number, required: true }
});

// Define the flight schema inline
const flightSchema = new mongoose.Schema({
    flightNumber: { type: String, required: true },
    airline: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true },
    departureAirport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    arrivalAirport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    aircraft: { type: mongoose.Schema.Types.ObjectId, ref: 'Aircraft', required: true },
    seats: [seatSchema],
    basePrice: {
        economy: { type: Number, required: true },
        business: { type: Number, required: true },
        first: { type: Number, required: true }
    },
    baggage: {
        carryOn: {
            maxWeight: { type: Number, default: 8 },
            maxDimensions: { type: String, default: "55x40x20 cm" }
        },
        checked: {
            included: { type: Number, default: 1 },
            maxWeight: { type: Number, default: 23 },
            extraBagPrice: { type: Number, default: 50 }
        }
    },
    services: {
        meal: { type: Boolean, default: false },
        wifi: { type: Boolean, default: false },
        entertainment: { type: Boolean, default: false },
        extraLegroom: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'],
        default: 'scheduled'
    },
    gate: { type: String },
    terminal: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const Flight = mongoose.model('Flight', flightSchema);

// Aircraft schema
const aircraftSchema = new mongoose.Schema({
    model: { type: String, required: true },
    capacity: { type: Number, required: true }
});

const Aircraft = mongoose.model('Aircraft', aircraftSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taw_airline');

async function regenerateSeatsForFlight(flightId) {
    try {
        console.log('Looking for flight with ID:', flightId);

        // First check if flight exists
        const flight = await Flight.findById(flightId);

        if (!flight) {
            console.log('Flight not found. Let me check available flights...');
            const allFlights = await Flight.find({}).limit(5);
            console.log('Available flights:', allFlights.map(f => ({ id: f._id, flightNumber: f.flightNumber })));
            return;
        }

        console.log('Found flight:', flight.flightNumber);
        console.log('Current seats count:', flight.seats.length);

        // Now try to populate aircraft
        try {
            await flight.populate('aircraft');
        } catch (error) {
            console.log('Could not populate aircraft:', error.message);
        }

        let capacity = 180; // Default capacity for Airbus A320

        if (flight.aircraft && flight.aircraft.capacity) {
            capacity = flight.aircraft.capacity;
            console.log('Aircraft:', flight.aircraft.model);
            console.log('Capacity:', capacity);
        } else {
            console.log('Using default capacity:', capacity);
        }
        console.log('Base prices:', flight.basePrice);

        const basePrice = flight.basePrice;

        // Generate seats based on aircraft capacity with realistic layout
        const seats = [];

        // Calculate seat distribution
        const firstSeats = Math.floor(capacity * 0.1);  // 10% first class
        const businessSeats = Math.floor(capacity * 0.2); // 20% business class  
        const economySeats = capacity - firstSeats - businessSeats; // 70% economy

        console.log('Seat distribution:');
        console.log('- First class:', firstSeats);
        console.log('- Business class:', businessSeats);
        console.log('- Economy class:', economySeats);

        let currentRow = 1;

        // Generate first class seats (rows 1-3, 2 seats per row: A, F)
        const firstRows = Math.ceil(firstSeats / 2);
        for (let row = currentRow; row < currentRow + firstRows; row++) {
            const seatsInRow = ['A', 'F']; // Only window seats in first class
            for (let i = 0; i < seatsInRow.length && ((row - currentRow) * 2 + i + 1) <= firstSeats; i++) {
                seats.push({
                    seatNumber: `${row}${seatsInRow[i]}`,
                    class: 'first',
                    isAvailable: true,
                    price: Math.floor(basePrice.first * (0.9 + Math.random() * 0.2)) // ±10% variation
                });
            }
        }
        currentRow += firstRows;

        // Generate business class seats (rows after first class, 4 seats per row: A, C, D, F)
        const businessRows = Math.ceil(businessSeats / 4);
        for (let row = currentRow; row < currentRow + businessRows; row++) {
            const seatsInRow = ['A', 'C', 'D', 'F']; // Business class layout
            for (let i = 0; i < seatsInRow.length && ((row - currentRow) * 4 + i + 1) <= businessSeats; i++) {
                seats.push({
                    seatNumber: `${row}${seatsInRow[i]}`,
                    class: 'business',
                    isAvailable: true,
                    price: Math.floor(basePrice.business * (0.9 + Math.random() * 0.2)) // ±10% variation
                });
            }
        }
        currentRow += businessRows;

        // Generate economy class seats (remaining rows, 6 seats per row: A, B, C, D, E, F)
        const economyRows = Math.ceil(economySeats / 6);
        for (let row = currentRow; row < currentRow + economyRows; row++) {
            const seatsInRow = ['A', 'B', 'C', 'D', 'E', 'F']; // Full economy layout
            for (let i = 0; i < seatsInRow.length && ((row - currentRow) * 6 + i + 1) <= economySeats; i++) {
                seats.push({
                    seatNumber: `${row}${seatsInRow[i]}`,
                    class: 'economy',
                    isAvailable: true,
                    price: Math.floor(basePrice.economy * (0.9 + Math.random() * 0.2)) // ±10% variation
                });
            }
        }

        console.log('Generated seats count:', seats.length);
        console.log('First few seats:', seats.slice(0, 10));

        // Update the flight with new seats
        await Flight.findByIdAndUpdate(flightId, { seats: seats });

        console.log('Flight seats updated successfully!');

        // Verify the update
        const updatedFlight = await Flight.findById(flightId);
        console.log('Verification - new seats count:', updatedFlight.seats.length);
        console.log('First class seats:', updatedFlight.seats.filter(s => s.class === 'first').length);
        console.log('Business class seats:', updatedFlight.seats.filter(s => s.class === 'business').length);
        console.log('Economy class seats:', updatedFlight.seats.filter(s => s.class === 'economy').length);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Run the script
const flightId = '68ce5ebe58a8b6fa1b3aca87';
regenerateSeatsForFlight(flightId);