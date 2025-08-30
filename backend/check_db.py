#!/usr/bin/env python3
"""
Database Check Script
View current data in your MongoDB database
"""

from pymongo import MongoClient
from bson.objectid import ObjectId
import json

def check_database():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
        db = client['booking_system']
        
        # Collections
        halls_collection = db['halls']
        time_slots_collection = db['time_slots']
        bookings_collection = db['bookings']
        maintenance_collection = db['maintenance']
        
        print("MongoDB Database Status")
        print("=" * 50)
        
        # Check halls
        halls_count = halls_collection.count_documents({})
        print(f"\nHALLS ({halls_count} total):")
        if halls_count > 0:
            for hall in halls_collection.find():
                available_status = "Available" if hall.get('is_available', True) else "Unavailable"
                active_status = "Active" if hall.get('is_active', True) else "Inactive"
                print(f"   - {hall['name']} - {hall['location']} (Capacity: {hall['capacity']})")
                print(f"     Status: {available_status} | {active_status}")
                print(f"     Features: {', '.join(hall.get('features', []))}")
                print()
        else:
            print("   No halls found")
        
        # Check time slots
        slots_count = time_slots_collection.count_documents({})
        print(f"\nTIME SLOTS ({slots_count} total):")
        if slots_count > 0:
            for slot in time_slots_collection.find().sort('slot_order', 1):
                print(f"   - {slot['time']} ({slot.get('duration', 'N/A')})")
        else:
            print("   No time slots found")
        
        # Check bookings
        bookings_count = bookings_collection.count_documents({})
        print(f"\nBOOKINGS ({bookings_count} total):")
        if bookings_count > 0:
            for booking in bookings_collection.find().sort('submitted_at', -1).limit(5):
                hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
                hall_name = hall['name'] if hall else 'Unknown Hall'
                print(f"   - {booking['booking_id']} - {hall_name} ({booking['status']})")
                print(f"     Event: {booking['event_title']} by {booking['name']}")
                print(f"     Date: {booking['booking_date']}")
                print()
        else:
            print("   No bookings found")
        
        # Check maintenance
        maintenance_count = maintenance_collection.count_documents({})
        print(f"\nMAINTENANCE ({maintenance_count} total):")
        if maintenance_count > 0:
            for maint in maintenance_collection.find():
                hall = halls_collection.find_one({'_id': ObjectId(maint['hall_id'])})
                hall_name = hall['name'] if hall else 'Unknown Hall'
                print(f"   - {hall_name} - {maint['maintenance_date']}")
                print(f"     Reason: {maint['reason']}")
        else:
            print("   No maintenance schedules found")
        
        print("\n" + "=" * 50)
        print("Database check completed")
        
        client.close()
        
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == '__main__':
    check_database()