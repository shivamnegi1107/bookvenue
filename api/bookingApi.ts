import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking } from '@/types/booking';

// Helper function to format time to HH:MM
const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If in HH:MM:SS format, extract HH:MM
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  
  // If it's just a number (hour), format it
  const hour = parseInt(timeString);
  if (!isNaN(hour)) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
  
  return timeString;
};

const API_URL = 'https://admin.bookvenue.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookingApi = {
  getBookings: async (): Promise<Booking[]> => {
    try {
      console.log('Fetching bookings...');
      const response = await api.get('/my-bookings');
      console.log('Raw booking response:', response.data);

      if (!response.data) {
        console.warn('No data in response');
        return [];
      }

      const bookingsData = response.data.bookings || [];

      console.log('Processing bookings data:', bookingsData);
      
      return bookingsData.map((booking: any) => {
        // Parse facility images
        let facilityImages = [];
        try {
          if (booking.images) {
            const parsedImages = JSON.parse(booking.images);
            facilityImages = parsedImages.map((img: string) => 
              `https://admin.bookvenue.app/${img.replace(/\\/g, '/')}`
            );
          }
        } catch (e) {
          console.warn('Failed to parse facility images:', e);
        }
        
        // Add featured image if available
        if (booking.facility_image) {
          facilityImages.unshift(`https://admin.bookvenue.app/${booking.facility_image}`);
        }
        
        // Fallback image if no images available
        if (facilityImages.length === 0) {
          facilityImages = ['https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'];
        }

        const facilityName = booking.facility || 'Unknown Venue';
        const courtName = booking.court || 'Court';
        const bookingDate = booking.date;
        const totalPrice = parseFloat(booking.price || '0');
        const bookingStatus = (booking.status || 'pending').toLowerCase();

        // Handle time slots - format them properly
        let startTime = '';
        let endTime = '';
        let slotsCount = booking.slots && booking.slots.length > 0 ? booking.slots.length : 0;

        if (booking.slots && booking.slots.length > 0) {
          const startTimes = booking.slots.map((slot: any) => {
            const time = slot.start_time || slot.startTime;
            return time ? formatTime(time) : null;
          }).filter(Boolean);
          const endTimes = booking.slots.map((slot: any) => {
            const time = slot.end_time || slot.endTime;
            return time ? formatTime(time) : null;
          }).filter(Boolean);
          
          startTime = startTimes.length > 0 ? startTimes.join(', ') : '';
          endTime = endTimes.length > 0 ? endTimes.join(', ') : '';
        }

        const processedBooking = {
          id: booking.bookingId?.toString() || Math.random().toString(),
          venue: {
            id: booking.facility_slug || 'venue-1',
            name: facilityName,
            location: booking.address || 'Location not available',
            type: courtName,
            slug: booking.facility_slug || 'venue-1',
            images: facilityImages,
            coordinates: {
              latitude: parseFloat(booking.lat || '28.6139'),
              longitude: parseFloat(booking.lng || '77.2090')
            }
          },
          date: bookingDate,
          startTime: startTime,
          endTime: endTime,
          totalAmount: totalPrice,
          status: bookingStatus as 'pending' | 'confirmed' | 'cancelled',
          slots: slotsCount
        };

        console.log('Processed booking:', processedBooking);
        return processedBooking;
      });
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
    }
  
  getBookingById: async (id: string): Promise<Booking> => {
    try {
      console.log('Fetching booking by ID:', id);
      const response = await api.get(`/booking/${id}`);
      const booking = response.data.booking || response.data;
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      console.log('Booking details:', booking);
      
      const venueImage = booking.venue_image || 
        (booking.facility?.featured_image ? 
        `https://admin.bookvenue.app/${booking.facility.featured_image.replace(/\\/g, '/')}` :
        'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
      
      return {
        id: booking.id?.toString() || id,
        venue: {
          id: booking.facility_id?.toString() || 'venue-1',
          name: booking.facility_name || booking.facility?.official_name || 'Unknown Venue',
          type: booking.court_name || booking.court?.court_name || 'Court',
          location: booking.venue_location || booking.facility?.address || 'Location not available',
          slug: booking.facility_slug || booking.facility?.slug || 'venue-1',
          images: [venueImage],
          coordinates: {
            latitude: parseFloat(booking.venue_lat || booking.facility?.lat || '28.6139'),
            longitude: parseFloat(booking.venue_lng || booking.facility?.lng || '77.2090')
          }
        },
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalAmount: parseFloat(booking.total_price || booking.price || '0'),
        status: (booking.status || 'pending').toLowerCase() as 'pending' | 'confirmed' | 'cancelled'
      };
    } catch (error: any) {
      console.error('Error fetching booking by ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch booking');
    }
  },

  // Get court availability - updated to use the correct API
  getCourtAvailability: async (facilityId: string, courtId: string, date: string) => {
    try {
      console.log('Fetching court availability:', { facilityId, courtId, date });
      const response = await api.get(`/court-availability/${facilityId}/${courtId}/${date}`);
      console.log('Court availability response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching court availability:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch availability');
    }
  },
  
  createBooking: async (bookingData: any) => {
    try {
      console.log('Creating booking with data:', bookingData);
      const response = await api.post('/booking', bookingData);
      console.log('Booking creation response:', response.data);
      return {
        success: true,
        order: response.data.order,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Booking creation error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to create booking');
    }
  },

  cancelBooking: async (bookingId: string) => {
    try {
      console.log('Cancelling booking:', bookingId);
      const response = await api.get(`/cancel-booking/${bookingId}`);
      console.log('Booking cancelled successfully');
      return response.data;
    } catch (error: any) {
      console.error('Booking cancellation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
  },

  paymentSuccess: async (paymentData: any) => {
    try {
      console.log('Updating payment success:', paymentData);
      const response = await api.post('/payment-success', paymentData);
      console.log('Payment success updated');
      return response.data;
    } catch (error: any) {
      console.error('Payment success update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update payment status');
    }
  },

  paymentFailure: async (paymentData: any) => {
    try {
      console.log('Updating payment failure:', paymentData);
      const response = await api.post('/payment-failure', paymentData);
      console.log('Payment failure updated');
      return response.data;
    } catch (error: any) {
      console.error('Payment failure update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update payment status');
    }
  }
};