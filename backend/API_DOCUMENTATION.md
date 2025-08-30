# Booking System API Documentation

Complete API documentation for the Hall Booking System backend.

## Base URL
```
http://localhost:5000
```

## Authentication
Currently, no authentication is required. In production, add JWT or session-based auth.

---

## 📋 Core Booking APIs

### 1. Get All Halls
- **GET** `/api/halls`
- **Description**: Fetch all active halls
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "hall_object_id",
      "name": "Hall A",
      "location": "FET Ground Floor",
      "capacity": 100,
      "description": "Located on the ground floor...",
      "amenities": ["Projector", "AC", "WiFi"],
      "features": ["Projector", "AC", "WiFi"],
      "color": "#3498db",
      "icon": "🏛️",
      "image_url": "",
      "isAvailable": true
    }
  ]
}
```

### 2. Get Time Slots for Hall
- **GET** `/api/halls/{hall_id}/timeslots?date=YYYY-MM-DD`
- **Description**: Get available time slots for a specific hall and date
- **Parameters**:
  - `hall_id` (path): Hall ObjectId
  - `date` (query): Date in YYYY-MM-DD format (optional, defaults to today)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "slot_object_id",
      "time": "8:45 AM – 10:45 AM",
      "duration": "2 hours",
      "available": true,
      "isAvailable": true,
      "reason": null,
      "date": "2024-01-15",
      "hall_id": "hall_object_id"
    }
  ],
  "message": "Time slots loaded for 2024-01-15"
}
```

### 3. Submit Booking
- **POST** `/api/bookings`
- **Description**: Submit a new booking request
- **Request Body**:
```json
{
  "hall": {
    "id": "hall_object_id",
    "name": "Hall A"
  },
  "timeSlots": [
    {
      "id": "slot_object_id",
      "time": "8:45 AM – 10:45 AM",
      "date": "2024-01-15"
    }
  ],
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "organization": "ABC Corp",
  "eventTitle": "Annual Meeting",
  "description": "Company annual meeting",
  "attendees": 50
}
```

### 4. Get All Bookings
- **GET** `/api/bookings`
- **Description**: Get all bookings (admin function)

### 5. Get Booking Details
- **GET** `/api/bookings/{booking_id}`
- **Description**: Get detailed information for a specific booking
- **Parameters**:
  - `booking_id` (path): Booking ID (e.g., "BK1234567890")

### 6. Approve Booking
- **PUT** `/api/bookings/{booking_id}/approve`
- **Description**: Approve a pending booking

### 7. Reject Booking
- **PUT** `/api/bookings/{booking_id}/reject`
- **Description**: Reject a booking with reason
- **Request Body**:
```json
{
  "reason": "Hall unavailable due to maintenance"
}
```

---

## 📊 Admin Dashboard APIs

### 8. Get Dashboard Statistics
- **GET** `/api/admin/dashboard/stats`
- **Description**: Get comprehensive dashboard statistics
- **Response**:
```json
{
  "success": true,
  "data": {
    "total_bookings": 25,
    "total_halls": 3,
    "pending_bookings": 5,
    "approved_bookings": 15,
    "rejected_bookings": 5,
    "todays_bookings": 3,
    "recent_bookings": [
      {
        "booking_id": "BK1234567890",
        "event_title": "Annual Meeting",
        "hall_name": "Hall A",
        "status": "pending",
        "booking_date": "2024-01-15",
        "submitted_at": "2024-01-10T10:30:00.000Z"
      }
    ]
  }
}
```

### 9. Create Priority Booking
- **POST** `/api/admin/priority-booking`
- **Description**: Create an auto-approved priority booking
- **Request Body**:
```json
{
  "hall_id": "hall_object_id",
  "time_slot_id": "slot_object_id",
  "booking_date": "2024-01-15",
  "requester_name": "Admin User",
  "requester_email": "admin@booking.com",
  "requester_phone": "+1234567890",
  "department": "Administration",
  "purpose": "Emergency Meeting",
  "notes": "Urgent priority booking",
  "attendees": 50
}
```

### 10. Get Admin Users
- **GET** `/api/admin/users`
- **Description**: Get list of admin users (mock data for now)

---

## 🏛️ Hall Management APIs

### 11. Create Hall
- **POST** `/api/admin/halls`
- **Description**: Create a new hall
- **Request Body**:
```json
{
  "name": "Hall D",
  "location": "New Building",
  "capacity": 75,
  "description": "New multipurpose hall",
  "amenities": ["Projector", "AC"],
  "features": ["Projector", "AC"],
  "color": "#9b59b6",
  "icon": "🏢"
}
```

### 12. Update Hall
- **PUT** `/api/admin/halls/{hall_id}`
- **Description**: Update hall information
- **Parameters**:
  - `hall_id` (path): Hall ObjectId

### 13. Toggle Hall Status
- **PUT** `/api/admin/halls/{hall_id}/toggle`
- **Description**: Activate or deactivate a hall

---

## 🔧 Maintenance APIs

### 14. Schedule Maintenance
- **POST** `/api/admin/maintenance`
- **Description**: Schedule maintenance for a hall
- **Request Body**:
```json
{
  "hall_id": "hall_object_id",
  "maintenance_date": "2024-01-20",
  "time_slot_id": "slot_object_id",  // Optional - null for full day
  "reason": "Annual maintenance check"
}
```

### 15. Get Maintenance Schedules
- **GET** `/api/admin/maintenance`
- **Description**: Get all active maintenance schedules

---

## 🗄️ Database Collections

### halls
```javascript
{
  _id: ObjectId,
  name: "Hall A",
  location: "FET Ground Floor",
  capacity: 100,
  description: "Located on the ground floor...",
  amenities: ["Projector", "AC", "WiFi"],
  features: ["Projector", "AC", "WiFi"],
  color: "#3498db",
  icon: "🏛️",
  image_url: "",
  is_available: true,
  is_active: true,
  created_at: ISODate,
  updated_at: ISODate  // Added on updates
}
```

### time_slots
```javascript
{
  _id: ObjectId,
  time: "8:45 AM – 10:45 AM",
  duration: "2 hours",
  start_time: "08:45",
  end_time: "10:45",
  slot_order: 1,
  is_available: true,
  is_active: true
}
```

### bookings
```javascript
{
  _id: ObjectId,
  booking_id: "BK1234567890",  // or "PR1234567890" for priority
  hall_id: "hall_object_id",
  time_slot_id: "slot_object_id",
  booking_date: "2024-01-15",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  organization: "ABC Corp",
  event_title: "Annual Meeting",
  description: "Company annual meeting",
  attendees: 50,
  status: "pending", // "approved", "rejected"
  submitted_at: ISODate,
  approved_at: ISODate,
  approved_by: "Admin",
  rejection_reason: "Reason text",
  priority_booking: true  // For priority bookings
}
```

### maintenance
```javascript
{
  _id: ObjectId,
  hall_id: "hall_object_id",
  maintenance_date: "2024-01-20",
  time_slot_id: "slot_object_id",  // null for full day
  reason: "Scheduled maintenance",
  is_active: true,
  created_at: ISODate,
  created_by: "Admin"
}
```

---

## 🚀 Quick Start

1. **Start MongoDB Atlas** (already configured)
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Reset/populate database**:
   ```bash
   python reset_db.py
   ```
4. **Start Flask server**:
   ```bash
   python app.py
   ```
5. **Check database**:
   ```bash
   python check_db.py
   ```

## 🔐 Security Notes

- Add authentication middleware for admin endpoints
- Validate input data and sanitize requests
- Use environment variables for MongoDB credentials
- Implement rate limiting for public endpoints
- Add CORS configuration for production

## 📝 Frontend Integration

Your React Native app can now use all these endpoints. Key integration points:

- **Confirmation Screen**: Use `GET /api/bookings/{booking_id}` to fetch booking details
- **Admin Dashboard**: Use `GET /api/admin/dashboard/stats` for statistics
- **Admin Functions**: Use priority booking, hall management, and maintenance endpoints
- **Real-time Updates**: Consider WebSocket integration for live booking updates