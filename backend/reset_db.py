#!/usr/bin/env python3
"""
Database Reset and Population Script
This script will clear existing data and populate MongoDB with fresh hall and timeslot data
"""

from pymongo import MongoClient
from datetime import datetime
import sys

def reset_database():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
        db = client['booking_system']
        
        # Collections
        halls_collection = db['halls']
        time_slots_collection = db['time_slots']
        bookings_collection = db['bookings']
        maintenance_collection = db['maintenance']
        
        print("🔄 Resetting database...")
        
        # Clear existing data
        halls_collection.delete_many({})
        time_slots_collection.delete_many({})
        bookings_collection.delete_many({})
        maintenance_collection.delete_many({})
        
        print("✅ Cleared existing data")
        
        # Add halls based on your dummy data
        halls = [
            {
                'name': 'Hall A',
                'location': 'FET Ground Floor',
                'capacity': 100,
                'description': 'Located on the ground floor of FET building. Perfect for presentations and seminars with modern amenities.',
                'amenities': ['Projector', 'AC', 'WiFi', 'Sound System', 'Whiteboard'],
                'features': ['Projector', 'AC', 'WiFi', 'Sound System', 'Whiteboard'],
                'color': '#3498db',
                'icon': '🏛️',
                'image_url': '',
                'is_available': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            },
            {
                'name': 'Hall B',
                'location': 'FET 1st Floor',
                'capacity': 150,
                'description': 'Located on the 1st floor of FET building. Spacious hall ideal for conferences and large gatherings.',
                'amenities': ['Projector', 'AC', 'WiFi', 'Stage', 'Microphones', 'Audio System'],
                'features': ['Projector', 'AC', 'WiFi', 'Stage', 'Microphones', 'Audio System'],
                'color': '#2ecc71',
                'icon': '🎯',
                'image_url': '',
                'is_available': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            },
            {
                'name': 'Hall C',
                'location': 'Core Block',
                'capacity': 200,
                'description': 'Located in the Core Block. Premium hall with advanced facilities for major events and conferences.',
                'amenities': ['Projector', 'AC', 'WiFi', 'Stage', 'Sound System', 'Recording', 'LED Display'],
                'features': ['Projector', 'AC', 'WiFi', 'Stage', 'Sound System', 'Recording', 'LED Display'],
                'color': '#e74c3c',
                'icon': '🏢',
                'image_url': '',
                'is_available': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            }
        ]
        
        result = halls_collection.insert_many(halls)
        print(f"✅ Added {len(result.inserted_ids)} halls to database")
        
        # Add time slots based on your dummy data
        slots = [
            {
                'time': '8:45 AM – 10:45 AM',
                'duration': '2 hours',
                'start_time': '08:45',
                'end_time': '10:45',
                'slot_order': 1,
                'is_available': True,
                'is_active': True
            },
            {
                'time': '11:00 AM – 01:00 PM',
                'duration': '2 hours',
                'start_time': '11:00',
                'end_time': '13:00',
                'slot_order': 2,
                'is_available': True,
                'is_active': True
            },
            {
                'time': '01:00 PM – 03:45 PM',
                'duration': '2 hours 45 minutes',
                'start_time': '13:00',
                'end_time': '15:45',
                'slot_order': 3,
                'is_available': True,
                'is_active': True
            },
            {
                'time': 'Full Day',
                'duration': '8 hours',
                'start_time': '08:45',
                'end_time': '17:00',
                'slot_order': 4,
                'is_available': True,
                'is_active': True
            }
        ]
        
        result = time_slots_collection.insert_many(slots)
        print(f"✅ Added {len(result.inserted_ids)} time slots to database")
        
        # Add sample maintenance schedule
        sample_maintenance = [
            {
                'hall_id': str(halls_collection.find_one({'name': 'Hall A'})['_id']),
                'maintenance_date': '2024-12-25',
                'time_slot_id': None,  # All day maintenance
                'reason': 'Christmas holiday - Hall closed',
                'is_active': True
            }
        ]
        
        maintenance_collection.insert_many(sample_maintenance)
        print("✅ Added sample maintenance schedules")
        
        print("\n🎉 Database reset and population completed successfully!")
        print("\n📊 Database Summary:")
        print(f"   • Halls: {halls_collection.count_documents({})}")
        print(f"   • Time Slots: {time_slots_collection.count_documents({})}")
        print(f"   • Bookings: {bookings_collection.count_documents({})}")
        print(f"   • Maintenance: {maintenance_collection.count_documents({})}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("🚀 MongoDB Database Reset Tool")
    print("This will delete all existing data and populate with fresh data")
    
    confirm = input("\n⚠️  Are you sure you want to reset the database? (y/N): ")
    
    if confirm.lower() in ['y', 'yes']:
        reset_database()
    else:
        print("❌ Database reset cancelled")