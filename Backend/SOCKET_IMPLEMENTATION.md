# Socket.IO Implementation for ReturnLorry

## Overview
This implementation provides real-time communication between customers and drivers for fare negotiations and ride management.

## Socket Events

### Connection Events

#### 1. Driver Authentication
```javascript
// Client-side (Driver App)
socket.emit("driver_auth", driverId);

// Server Response
// Driver is now mapped to their socket ID for targeted notifications
```

#### 2. Customer Authentication
```javascript
// Client-side (Customer App)
socket.emit("customer_auth", customerId);

// Server Response
// Customer is now mapped to their socket ID
```

#### 3. Driver Location Update
```javascript
// Client-side (Driver App)
socket.emit("update_location", {
  lat: 22.5726,
  lng: 88.3639,
  driverId: 123
});
```

### Notification Events

#### 1. Customer Starts Negotiation with Driver
```javascript
// Server sends to specific driver
socket.on("customer_negotiation_started", (data) => {
  console.log(data);
  // {
  //   bookingId: 456,
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
  
  // Client should call API to get full booking details
  fetchBookingDetails(data.bookingId);
});
```

#### 2. Driver Started Fare Negotiation
```javascript
// Server sends to specific customer
socket.on("driver_negotiation_started", (data) => {
  console.log(data);
  // {
  //   bookingId: 456,
  //   negotiatedFare: "₹500",
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
  
  // Show negotiation UI to customer
  showNegotiationModal(data.negotiatedFare);
});
```

#### 3. Customer Accepted Driver's Negotiated Fare
```javascript
// Server sends to specific driver
socket.on("customer_accepted_fare", (data) => {
  console.log(data);
  // {
  //   bookingId: 456,
  //   acceptedFare: "₹450",
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
  
  // Show success message and navigate to ride tracking
  showSuccessMessage("Customer accepted your fare!");
  navigateToRideTracking(data.bookingId);
});
```

#### 4. Driver Accepted Customer's Ride
```javascript
// Server sends to specific customer
socket.on("ride_accepted", (data) => {
  console.log(data);
  // {
  //   bookingId: 456,
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
  
  // Client should call API to get full booking details
  fetchBookingDetails(data.bookingId);
});
```

#### 5. New Ride Request (Existing)
```javascript
// Server sends to nearby drivers
socket.on("new_ride_request", (data) => {
  console.log(data);
  // Contains ride details and distance
});
```

#### 6. New Negotiated Fare (Existing)
```javascript
// Server sends to all connected clients
socket.on("new_negotiated_fare", (data) => {
  console.log(data);
  // { message: "New negotiated fare" }
});
```

#### 7. New Accepted Ride (Existing)
```javascript
// Server sends to all connected clients
socket.on("new_accepted_ride", (data) => {
  console.log(data);
  // { message: "New accepted ride" }
});
```

## API Endpoints

### Customer Endpoints

#### Accept Negotiated Fare (Customer)
```http
POST /api/app/Customer/booking/acceptNegotiatedFare
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "bookingId": 456,
  "driverId": 123,
  "acceptedFare": "450"
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Negotiation initiated successfully"
}
```

This endpoint:
1. Validates the customer owns the booking
2. Checks if the driver exists
3. Creates a negotiation record in the database
4. Sends a real-time notification to the specific driver

## Frontend Implementation Examples

### Driver App (React/React Native)
```javascript
import io from 'socket.io-client';

const socket = io('https://your-backend-url.com');

// Authenticate driver when they log in
const authenticateDriver = (driverId) => {
  socket.emit('driver_auth', driverId);
};

// Listen for negotiation requests
socket.on('customer_negotiation_started', async (data) => {
  // Show immediate notification
  showNotification({
    title: 'New Fare Negotiation',
    message: 'Customer wants to negotiate fare',
    bookingId: data.bookingId
  });
  
  // Fetch full booking details from API
  try {
    const bookingDetails = await fetchBookingDetails(data.bookingId);
    navigateToNegotiation(bookingDetails);
  } catch (error) {
    console.error('Error fetching booking details:', error);
  }
});

// Update location periodically
const updateLocation = (lat, lng, driverId) => {
  socket.emit('update_location', { lat, lng, driverId });
};
```

### Customer App (React/React Native)
```javascript
import io from 'socket.io-client';

const socket = io('https://your-backend-url.com');

// Authenticate customer when they log in
const authenticateCustomer = (customerId) => {
  socket.emit('customer_auth', customerId);
};

// Listen for driver negotiation notifications
socket.on('driver_negotiation_started', (data) => {
  // Show negotiation modal
  showNegotiationModal({
    bookingId: data.bookingId,
    proposedFare: data.negotiatedFare,
    onAccept: () => acceptNegotiatedFare(data.bookingId, data.negotiatedFare),
    onReject: () => rejectNegotiatedFare(data.bookingId)
  });
});

// Listen for customer accepted fare notifications (Driver App)
socket.on('customer_accepted_fare', (data) => {
  // Show success message and navigate to ride tracking
  showSuccessNotification({
    title: 'Fare Accepted!',
    message: `Customer accepted ₹${data.acceptedFare}`,
    bookingId: data.bookingId
  });
  
  // Navigate to ride tracking screen
  navigateToRideTracking(data.bookingId);
});

// Listen for ride acceptance notifications
socket.on('ride_accepted', async (data) => {
  // Show immediate notification
  showNotification({
    title: 'Ride Accepted!',
    message: 'Your driver is on the way',
    bookingId: data.bookingId
  });
  
  // Fetch full booking details from API
  try {
    const bookingDetails = await fetchBookingDetails(data.bookingId);
    navigateToRideTracking(bookingDetails);
  } catch (error) {
    console.error('Error fetching booking details:', error);
  }
});

// Initiate negotiation with a driver
const initiateNegotiation = async (driverId, bookingId, proposedFare) => {
  try {
    const response = await fetch('/api/app/Customer/booking/initiateNegotiation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        driverId,
        bookingId,
        proposedFare
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Negotiation initiated successfully');
    }
  } catch (error) {
    console.error('Error initiating negotiation:', error);
  }
};
```

## Database Schema

The implementation uses the existing `FareNegotiation` model:

```prisma
model FareNegotiation {
  Id              Int      @id @default(autoincrement())
  BookingId       Int
  DriverId        Int
  OwnerId         Int?
  NegotiatedFare  String
  Status          String   @default("Pending")
  NegotiatedTime  DateTime
  IsCustomerInitiated Boolean @default(false)
  // ... other fields
}
```

## Security Considerations

1. **Authentication**: All socket connections should be authenticated using JWT tokens
2. **Authorization**: Validate that customers can only negotiate their own bookings
3. **Rate Limiting**: Implement rate limiting for socket events
4. **Input Validation**: Validate all data before processing

## Error Handling

The implementation includes proper error handling:
- Driver not connected: Logs warning and continues
- Invalid data: Returns appropriate error responses
- Database errors: Handled gracefully with user-friendly messages

## Testing

Test the implementation using:
1. **Socket.IO Client Tools**: Use browser dev tools or Socket.IO client libraries
2. **API Testing**: Use Postman or similar tools for endpoint testing
3. **Real Device Testing**: Test on actual mobile devices for location updates

## Deployment Notes

1. Ensure CORS is properly configured for your frontend domains
2. Set up proper environment variables for production
3. Configure Redis for Socket.IO clustering if needed
4. Monitor socket connections and implement proper cleanup
