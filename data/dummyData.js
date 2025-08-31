export const halls = [
  {
    id: '1',
    name: 'Hall A',
    location: 'FET Ground Floor',
    capacity: 250,
    features: ['Projector', 'AC', 'WiFi', 'Sound System', 'Whiteboard'],
    isAvailable: true,
    description: 'Located on the ground floor of FET building. Perfect for presentations and seminars with modern amenities.',
    color: '#3498db',
    icon: '🏛️',
  },
  {
    id: '2',
    name: 'Hall B',
    location: 'FET 1st Floor',
    capacity: 150,
    features: ['Projector', 'AC', 'WiFi', 'Stage', 'Microphones', 'Audio System'],
    isAvailable: true,
    description: 'Located on the 1st floor of FET building. Spacious hall ideal for conferences and large gatherings.',
    color: '#2ecc71',
    icon: '🎯',
  },
  {
    id: '3',
    name: 'Hall C',
    location: 'Core Block',
    capacity: 200,
    features: ['Projector', 'AC', 'WiFi', 'Stage', 'Sound System', 'Recording', 'LED Display'],
    isAvailable: true,
    description: 'Located in the Core Block. Premium hall with advanced facilities for major events and conferences.',
    color: '#e74c3c',
    icon: '🏢',
  },
];

export const timeSlots = [
  {
    id: '1',
    time: '8:45 AM – 10:45 AM',
    duration: '2 hours',
    isAvailable: true,
  },
  {
    id: '2',
    time: '11:00 AM – 01:00 PM',
    duration: '2 hours',
    isAvailable: true,
  },
  {
    id: '3',
    time: '01:00 PM – 03:45 PM',
    duration: '2 hours 45 minutes',
    isAvailable: true,
  },
  {
    id: '4',
    time: 'Full Day',
    duration: '8 hours',
    isAvailable: true,
  },
];

export const sampleBookings = [
  {
    id: '1',
    hall: halls[0],
    timeSlots: [timeSlots[0]],
    requirements: 'Need projector and 50 chairs for presentation',
    status: 'pending',
    submittedAt: '2024-01-15T10:30:00.000Z',
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
  },
  {
    id: '2',
    hall: halls[1],
    timeSlots: [timeSlots[1], timeSlots[2]],
    requirements: 'Workshop setup with tables and flip charts',
    status: 'approved',
    submittedAt: '2024-01-14T14:20:00.000Z',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
  },
];