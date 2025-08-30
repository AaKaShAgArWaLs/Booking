#!/usr/bin/env python3
"""
Database Clear Script
Clear all data from MongoDB to test empty states
"""

from pymongo import MongoClient
import sys

def clear_database():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
        db = client['booking_system']
        
        # Collections
        halls_collection = db['halls']
        time_slots_collection = db['time_slots']
        bookings_collection = db['bookings']
        maintenance_collection = db['maintenance']
        
        print("🔄 Clearing all data from database...")
        
        # Clear all data
        halls_result = halls_collection.delete_many({})
        time_slots_result = time_slots_collection.delete_many({})
        bookings_result = bookings_collection.delete_many({})
        maintenance_result = maintenance_collection.delete_many({})
        
        print(f"✅ Cleared {halls_result.deleted_count} halls")
        print(f"✅ Cleared {time_slots_result.deleted_count} time slots")
        print(f"✅ Cleared {bookings_result.deleted_count} bookings")
        print(f"✅ Cleared {maintenance_result.deleted_count} maintenance schedules")
        
        print("\n🎉 Database cleared successfully!")
        print("📱 You can now test the empty states in your admin panel")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("🗑️  MongoDB Database Clear Tool")
    print("This will delete ALL data from the database")
    
    confirm = input("\n⚠️  Are you sure you want to clear ALL data? (type 'DELETE' to confirm): ")
    
    if confirm == 'DELETE':
        clear_database()
    else:
        print("❌ Database clear cancelled")