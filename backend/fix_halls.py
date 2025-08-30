#!/usr/bin/env python3
"""
Fix Hall Status Script
Set all halls to active status
"""

from pymongo import MongoClient
from bson.objectid import ObjectId

def fix_halls():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
        db = client['booking_system']
        
        halls_collection = db['halls']
        
        print("Fixing hall statuses...")
        
        # Update all halls to be active
        result = halls_collection.update_many(
            {},  # Update all halls
            {'$set': {'is_active': True}}
        )
        
        print(f"Updated {result.modified_count} halls to active status")
        
        # Show current status
        print("\nCurrent hall statuses:")
        for hall in halls_collection.find():
            available_status = "Available" if hall.get('is_available', True) else "Unavailable"
            active_status = "Active" if hall.get('is_active', True) else "Inactive"
            print(f"   - {hall['name']}: {available_status} | {active_status}")
        
        client.close()
        print("\nHall statuses fixed successfully!")
        
    except Exception as e:
        print(f"Error fixing halls: {e}")

if __name__ == '__main__':
    fix_halls()