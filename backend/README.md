# Booking System Backend

Flask backend with MongoDB for the Hall Booking System.

## Prerequisites

- Python 3.8 or higher
- MongoDB installed and running on localhost:27017
- pip package manager

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start MongoDB**
   - Make sure MongoDB is installed and running on your system
   - Default connection: `mongodb://localhost:27017/`
   - Database name: `booking_system`

3. **Run the Application**
   ```bash
   python app.py
   ```
   
   The server will start on `http://localhost:5000`

## API Endpoints

### Halls
- `GET /api/halls` - Get all active halls
- Response format:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "hall_id",
        "name": "Conference Hall A",
        "location": "Main Building, Floor 1",
        "capacity": 100,
        "description": "Modern conference hall...",
        "amenities": ["Projector", "Sound System"],
        "image_url": ""
      }
    ]
  }
  ```

### Time Slots
- `GET /api/halls/<hall_id>/timeslots?date=YYYY-MM-DD` - Get available time slots for a hall on a specific date
- Response format:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "slot_id",
        "time": "9:00 AM - 11:00 AM",
        "available": true,
        "reason": null,
        "date": "2023-12-01",
        "hall_id": "hall_id"
      }
    ],
    "message": "Time slots loaded for 2023-12-01"
  }
  ```

### Bookings
- `POST /api/bookings` - Submit a new booking
- `GET /api/bookings` - Get all bookings (admin)
- `PUT /api/bookings/<booking_id>/approve` - Approve a booking
- `PUT /api/bookings/<booking_id>/reject` - Reject a booking

## Database Collections

### halls
```json
{
  "_id": ObjectId,
  "name": "Conference Hall A",
  "location": "Main Building, Floor 1",
  "capacity": 100,
  "description": "Modern conference hall...",
  "amenities": ["Projector", "Sound System"],
  "image_url": "",
  "is_active": true,
  "created_at": ISODate
}
```

### time_slots
```json
{
  "_id": ObjectId,
  "time": "9:00 AM - 11:00 AM",
  "start_time": "09:00",
  "end_time": "11:00",
  "slot_order": 1,
  "is_active": true
}
```

### bookings
```json
{
  "_id": ObjectId,
  "booking_id": "BK1234567890",
  "hall_id": "hall_object_id",
  "time_slot_id": "slot_object_id",
  "booking_date": "2023-12-01",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "organization": "ABC Corp",
  "event_title": "Annual Meeting",
  "description": "Company annual meeting",
  "attendees": 50,
  "status": "pending",
  "submitted_at": ISODate,
  "approved_at": ISODate,
  "approved_by": "Admin",
  "rejection_reason": null
}
```

### maintenance
```json
{
  "_id": ObjectId,
  "hall_id": "hall_object_id",
  "maintenance_date": "2023-12-01",
  "time_slot_id": "slot_object_id",
  "reason": "Maintenance scheduled",
  "is_active": true
}
```

## Sample Data

The application automatically creates sample data on first run:
- 3 sample halls (Conference Hall A, Seminar Hall B, Auditorium)
- 4 time slots (9:00-11:00, 11:30-13:30, 14:00-16:00, 16:30-18:30)

## Features

- **Real-time Availability**: Checks existing bookings and maintenance schedules
- **Date-based Filtering**: Returns availability for specific dates
- **Weekend Restrictions**: Configurable restrictions for weekends
- **Booking Management**: Full CRUD operations for bookings
- **Admin Functions**: Approve/reject bookings with reasons
- **Error Handling**: Comprehensive error handling and validation

## Configuration

You can modify the MongoDB connection string in `app.py`:
```python
client = MongoClient('mongodb://localhost:27017/')
db = client['booking_system']
```

For production, consider using environment variables:
```python
import os
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
```