from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# MongoDB connection
client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
db = client['booking_system']

# Collections
halls_collection = db['halls']
time_slots_collection = db['time_slots']
bookings_collection = db['bookings']
maintenance_collection = db['maintenance']

CORS(app)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# API Routes

@app.route('/api/halls', methods=['GET'])
def get_halls():
    try:
        # Show all halls that are active (not deleted), regardless of availability
        halls = list(halls_collection.find({'is_active': True}))
        return jsonify({
            'success': True,
            'data': [{
                'id': str(hall['_id']),
                'name': hall['name'],
                'location': hall['location'],
                'capacity': hall['capacity'],
                'description': hall.get('description', ''),
                'amenities': hall.get('amenities', []),
                'features': hall.get('features', []),
                'color': hall.get('color', '#3498db'),
                'icon': hall.get('icon', '🏛️'),
                'image_url': hall.get('image_url', ''),
                'isAvailable': hall.get('is_available', True),
                'availabilityStatus': 'Available' if hall.get('is_available', True) else 'Unavailable'
            } for hall in halls]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch halls',
            'message': str(e)
        }), 500

@app.route('/api/halls/<hall_id>/timeslots', methods=['GET'])
def get_time_slots(hall_id):
    try:
        date_str = request.args.get('date')
        if not date_str:
            date_str = datetime.now().strftime('%Y-%m-%d')
        
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Check if hall is available
        hall = halls_collection.find_one({'_id': ObjectId(hall_id)})
        hall_available = hall.get('is_available', True) if hall else False
        
        # Get all active time slots
        time_slots = list(time_slots_collection.find({'is_active': True}))
        
        # Get existing bookings for this hall and date
        existing_bookings = list(bookings_collection.find({
            'hall_id': hall_id,
            'booking_date': date_str,
            'status': {'$in': ['pending', 'approved']}
        }))
        
        booked_slot_ids = {str(booking['time_slot_id']) for booking in existing_bookings}
        
        # Get maintenance schedules
        maintenance = list(maintenance_collection.find({
            'hall_id': hall_id,
            'maintenance_date': date_str,
            'is_active': True
        }))
        
        maintenance_slot_ids = {str(m['time_slot_id']) for m in maintenance if 'time_slot_id' in m}
        
        # Build response
        available_slots = []
        for slot in time_slots:
            slot_id = str(slot['_id'])
            is_available = True
            reason = None
            
            # If hall is unavailable, no slots are bookable
            if not hall_available:
                is_available = False
                reason = 'Hall is currently unavailable'
            elif slot_id in booked_slot_ids:
                is_available = False
                reason = 'Already booked'
            elif slot_id in maintenance_slot_ids:
                is_available = False
                reason = 'Maintenance scheduled'
            elif booking_date.weekday() in [5, 6]:  # Weekend restrictions
                if slot.get('slot_order', 0) in [1, 2]:  # Early morning slots
                    is_available = False
                    reason = 'Not available on weekends'
            
            available_slots.append({
                'id': slot_id,
                'time': slot['time'],
                'duration': slot.get('duration', '2 hours'),
                'available': is_available,
                'isAvailable': is_available,
                'reason': reason,
                'date': date_str,
                'hall_id': hall_id
            })
        
        return jsonify({
            'success': True,
            'data': available_slots,
            'message': f'Time slots loaded for {date_str}',
            'hallAvailable': hall_available,
            'requestParams': {
                'hall_id': hall_id,
                'date': date_str
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to load time slots. Please try again.',
            'message': str(e)
        }), 500

@app.route('/api/bookings', methods=['POST'])
def submit_booking():
    try:
        data = request.get_json()
        
        # Generate booking ID
        booking_id = f"BK{int(datetime.now().timestamp())}"
        
        # Get hall and time slot details
        hall = halls_collection.find_one({'_id': ObjectId(data['hall']['id'])})
        time_slot = time_slots_collection.find_one({'_id': ObjectId(data['timeSlots'][0]['id'])})
        
        if not hall or not time_slot:
            return jsonify({
                'success': False,
                'error': 'Invalid hall or time slot'
            }), 400
        
        # Create new booking document
        booking_doc = {
            'booking_id': booking_id,
            'hall_id': data['hall']['id'],
            'time_slot_id': data['timeSlots'][0]['id'],
            'booking_date': data['timeSlots'][0]['date'],
            'name': data['name'],
            'email': data['email'],
            'phone': data['phone'],
            'organization': data.get('organization', ''),
            'event_title': data['eventTitle'],
            'description': data.get('description', ''),
            'attendees': int(data['attendees']),
            'status': 'pending',
            'submitted_at': datetime.utcnow(),
            'approved_at': None,
            'approved_by': None,
            'rejection_reason': None
        }
        
        result = bookings_collection.insert_one(booking_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'booking_id': booking_id,
                'hall': data['hall'],
                'timeSlot': data['timeSlots'][0]['time'],
                'name': data['name'],
                'email': data['email'],
                'phone': data['phone'],
                'organization': data.get('organization', ''),
                'eventTitle': data['eventTitle'],
                'description': data.get('description', ''),
                'attendees': data['attendees'],
                'status': 'pending',
                'submittedAt': booking_doc['submitted_at'].isoformat()
            },
            'message': 'Booking submitted successfully! You will receive a confirmation email.'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to submit booking. Please try again.',
            'message': str(e)
        }), 500

@app.route('/api/bookings', methods=['GET'])
def get_all_bookings():
    try:
        bookings = list(bookings_collection.find().sort('submitted_at', -1))
        
        result_bookings = []
        for booking in bookings:
            # Get hall details
            hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
            time_slot = time_slots_collection.find_one({'_id': ObjectId(booking['time_slot_id'])})
            
            result_bookings.append({
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'hall': {
                    'id': str(hall['_id']) if hall else booking['hall_id'],
                    'name': hall['name'] if hall else 'Unknown Hall',
                    'location': hall['location'] if hall else ''
                },
                'timeSlot': time_slot['time'] if time_slot else 'Unknown Time',
                'booking_date': booking['booking_date'],
                'name': booking['name'],
                'email': booking['email'],
                'phone': booking['phone'],
                'organization': booking.get('organization', ''),
                'eventTitle': booking['event_title'],
                'description': booking.get('description', ''),
                'attendees': booking['attendees'],
                'status': booking['status'],
                'submittedAt': booking['submitted_at'].isoformat(),
                'approvedAt': booking['approved_at'].isoformat() if booking.get('approved_at') else None,
                'approvedBy': booking.get('approved_by'),
                'rejectionReason': booking.get('rejection_reason')
            })
        
        return jsonify({
            'success': True,
            'data': result_bookings
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch bookings',
            'message': str(e)
        }), 500

@app.route('/api/bookings/<booking_id>/approve', methods=['PUT'])
def approve_booking(booking_id):
    try:
        result = bookings_collection.update_one(
            {'booking_id': booking_id},
            {
                '$set': {
                    'status': 'approved',
                    'approved_at': datetime.utcnow(),
                    'approved_by': 'Admin'  # In real app, get from auth
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        booking = bookings_collection.find_one({'booking_id': booking_id})
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'status': booking['status']
            },
            'message': 'Booking approved successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to approve booking',
            'message': str(e)
        }), 500

@app.route('/api/bookings/<booking_id>/reject', methods=['PUT'])
def reject_booking(booking_id):
    try:
        data = request.get_json()
        
        result = bookings_collection.update_one(
            {'booking_id': booking_id},
            {
                '$set': {
                    'status': 'rejected',
                    'rejection_reason': data.get('reason', 'No reason provided')
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        booking = bookings_collection.find_one({'booking_id': booking_id})
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'status': booking['status']
            },
            'message': 'Booking rejected'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to reject booking',
            'message': str(e)
        }), 500

@app.route('/api/bookings/<booking_id>', methods=['GET'])
def get_booking_details(booking_id):
    try:
        booking = bookings_collection.find_one({'booking_id': booking_id})
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Get hall and time slot details
        hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
        time_slot = time_slots_collection.find_one({'_id': ObjectId(booking['time_slot_id'])})
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'hall': {
                    'id': str(hall['_id']) if hall else booking['hall_id'],
                    'name': hall['name'] if hall else 'Unknown Hall',
                    'location': hall['location'] if hall else '',
                    'capacity': hall['capacity'] if hall else 0
                },
                'timeSlot': time_slot['time'] if time_slot else 'Unknown Time',
                'booking_date': booking['booking_date'],
                'name': booking['name'],
                'email': booking['email'],
                'phone': booking['phone'],
                'organization': booking.get('organization', ''),
                'eventTitle': booking['event_title'],
                'description': booking.get('description', ''),
                'attendees': booking['attendees'],
                'status': booking['status'],
                'submittedAt': booking['submitted_at'].isoformat(),
                'approvedAt': booking['approved_at'].isoformat() if booking.get('approved_at') else None,
                'approvedBy': booking.get('approved_by'),
                'rejectionReason': booking.get('rejection_reason')
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch booking details',
            'message': str(e)
        }), 500

@app.route('/api/admin/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # Get total counts
        total_bookings = bookings_collection.count_documents({})
        total_halls = halls_collection.count_documents({'is_active': True})
        
        # Get status counts
        pending_bookings = bookings_collection.count_documents({'status': 'pending'})
        approved_bookings = bookings_collection.count_documents({'status': 'approved'})
        rejected_bookings = bookings_collection.count_documents({'status': 'rejected'})
        
        # Get today's bookings
        today = datetime.now().strftime('%Y-%m-%d')
        todays_bookings = bookings_collection.count_documents({'booking_date': today})
        
        # Get recent bookings (last 7 days)
        from datetime import timedelta
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        recent_bookings = list(bookings_collection.find({
            'booking_date': {'$gte': week_ago}
        }).sort('submitted_at', -1).limit(5))
        
        # Format recent bookings
        recent_bookings_formatted = []
        for booking in recent_bookings:
            hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
            recent_bookings_formatted.append({
                'booking_id': booking['booking_id'],
                'event_title': booking['event_title'],
                'hall_name': hall['name'] if hall else 'Unknown Hall',
                'status': booking['status'],
                'booking_date': booking['booking_date'],
                'submitted_at': booking['submitted_at'].isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_bookings': total_bookings,
                'total_halls': total_halls,
                'pending_bookings': pending_bookings,
                'approved_bookings': approved_bookings,
                'rejected_bookings': rejected_bookings,
                'todays_bookings': todays_bookings,
                'recent_bookings': recent_bookings_formatted
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard stats',
            'message': str(e)
        }), 500

@app.route('/api/admin/priority-booking', methods=['POST'])
def create_priority_booking():
    try:
        data = request.get_json()
        
        # Generate booking ID with priority prefix
        booking_id = f"PR{int(datetime.now().timestamp())}"
        
        # Get hall and time slot details
        hall = halls_collection.find_one({'_id': ObjectId(data['hall_id'])})
        time_slot = time_slots_collection.find_one({'_id': ObjectId(data['time_slot_id'])})
        
        if not hall or not time_slot:
            return jsonify({
                'success': False,
                'error': 'Invalid hall or time slot'
            }), 400
        
        # Create priority booking document
        booking_doc = {
            'booking_id': booking_id,
            'hall_id': data['hall_id'],
            'time_slot_id': data['time_slot_id'],
            'booking_date': data['booking_date'],
            'name': data['requester_name'],
            'email': data.get('requester_email', 'admin@booking.com'),
            'phone': data.get('requester_phone', 'N/A'),
            'organization': data['department'],
            'event_title': data['purpose'],
            'description': data.get('notes', ''),
            'attendees': int(data.get('attendees', 50)),
            'status': 'approved',  # Priority bookings are auto-approved
            'submitted_at': datetime.utcnow(),
            'approved_at': datetime.utcnow(),
            'approved_by': 'Admin (Priority)',
            'priority_booking': True,
            'rejection_reason': None
        }
        
        result = bookings_collection.insert_one(booking_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'booking_id': booking_id,
                'status': 'approved',
                'hall_name': hall['name'],
                'time_slot': time_slot['time']
            },
            'message': 'Priority booking created successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to create priority booking',
            'message': str(e)
        }), 500

@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    try:
        # For now, return mock admin users
        # In a real app, you would have a separate users collection
        users = [
            {
                'id': '1',
                'name': 'Admin User',
                'email': 'admin@booking.com',
                'role': 'Super Admin',
                'status': 'active',
                'lastLogin': datetime.utcnow().isoformat(),
                'permissions': ['all']
            },
            {
                'id': '2',
                'name': 'Hall Manager',
                'email': 'manager@booking.com',
                'role': 'Hall Manager',
                'status': 'active',
                'lastLogin': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                'permissions': ['bookings', 'halls']
            }
        ]
        
        return jsonify({
            'success': True,
            'data': users
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch admin users',
            'message': str(e)
        }), 500

@app.route('/api/admin/halls', methods=['POST'])
def create_hall():
    try:
        data = request.get_json()
        
        hall_doc = {
            'name': data['name'],
            'location': data['location'],
            'capacity': int(data['capacity']),
            'description': data.get('description', ''),
            'amenities': data.get('amenities', []),
            'features': data.get('features', []),
            'color': data.get('color', '#3498db'),
            'icon': data.get('icon', '🏛️'),
            'image_url': data.get('image_url', ''),
            'is_available': True,
            'is_active': True,
            'created_at': datetime.utcnow()
        }
        
        result = halls_collection.insert_one(hall_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'name': data['name'],
                'location': data['location']
            },
            'message': 'Hall created successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to create hall',
            'message': str(e)
        }), 500

@app.route('/api/admin/halls/<hall_id>', methods=['PUT'])
def update_hall(hall_id):
    try:
        data = request.get_json()
        
        update_doc = {}
        if 'name' in data:
            update_doc['name'] = data['name']
        if 'location' in data:
            update_doc['location'] = data['location']
        if 'capacity' in data:
            update_doc['capacity'] = int(data['capacity'])
        if 'description' in data:
            update_doc['description'] = data['description']
        if 'amenities' in data:
            update_doc['amenities'] = data['amenities']
        if 'features' in data:
            update_doc['features'] = data['features']
        if 'is_active' in data:
            update_doc['is_active'] = data['is_active']
        
        update_doc['updated_at'] = datetime.utcnow()
        
        result = halls_collection.update_one(
            {'_id': ObjectId(hall_id)},
            {'$set': update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Hall not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Hall updated successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update hall',
            'message': str(e)
        }), 500

@app.route('/api/admin/halls/<hall_id>/toggle', methods=['PUT'])
def toggle_hall_status(hall_id):
    try:
        hall = halls_collection.find_one({'_id': ObjectId(hall_id)})
        if not hall:
            return jsonify({
                'success': False,
                'error': 'Hall not found'
            }), 404
        
        new_status = not hall.get('is_available', True)
        
        halls_collection.update_one(
            {'_id': ObjectId(hall_id)},
            {'$set': {'is_available': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True,
            'data': {
                'hall_id': hall_id,
                'is_available': new_status
            },
            'message': f'Hall {"activated" if new_status else "deactivated"} successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to toggle hall status',
            'message': str(e)
        }), 500

@app.route('/api/admin/maintenance', methods=['POST'])
def schedule_maintenance():
    try:
        data = request.get_json()
        
        maintenance_doc = {
            'hall_id': data['hall_id'],
            'maintenance_date': data['maintenance_date'],
            'time_slot_id': data.get('time_slot_id'),  # Optional - can be None for full day
            'reason': data.get('reason', 'Scheduled maintenance'),
            'is_active': True,
            'created_at': datetime.utcnow(),
            'created_by': 'Admin'
        }
        
        result = maintenance_collection.insert_one(maintenance_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'maintenance_date': data['maintenance_date']
            },
            'message': 'Maintenance scheduled successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to schedule maintenance',
            'message': str(e)
        }), 500

@app.route('/api/admin/maintenance', methods=['GET'])
def get_maintenance_schedules():
    try:
        maintenance_schedules = list(maintenance_collection.find({'is_active': True}))
        
        formatted_schedules = []
        for schedule in maintenance_schedules:
            hall = halls_collection.find_one({'_id': ObjectId(schedule['hall_id'])})
            time_slot = None
            if schedule.get('time_slot_id'):
                time_slot = time_slots_collection.find_one({'_id': ObjectId(schedule['time_slot_id'])})
            
            formatted_schedules.append({
                'id': str(schedule['_id']),
                'hall_name': hall['name'] if hall else 'Unknown Hall',
                'maintenance_date': schedule['maintenance_date'],
                'time_slot': time_slot['time'] if time_slot else 'Full Day',
                'reason': schedule['reason'],
                'created_at': schedule['created_at'].isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': formatted_schedules
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch maintenance schedules',
            'message': str(e)
        }), 500

# Initialize database with sample data
def init_db():
    try:
        # Add sample halls if none exist
        if halls_collection.count_documents({}) == 0:
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
            halls_collection.insert_many(halls)
            print("Sample halls added to database")
        
        # Add sample time slots if none exist
        if time_slots_collection.count_documents({}) == 0:
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
            time_slots_collection.insert_many(slots)
            print("Sample time slots added to database")
            
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)