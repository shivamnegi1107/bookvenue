import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://admin.bookvenue.app/api';

// Create axios instance
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

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export interface BookingData {
  facility_id: number;
  court_id: number;
  date: string;
  duration: number;
  slot_count: number;
  total_price: number;
  name: string;
  email: string;
  contact: string;
  address: string;
  selected_slots: Array<{
    start_time: string;
    end_time: string;
    price: string;
  }>;
}

export interface Booking {
  bookingId: number;
  name: string;
  facility_slug: string;
  facility: string;
  facility_image: string;
  images: string[];
  lat: string;
  lng: string;
  court: string;
  date: string;
  price: string;
  status: string;
  slots: any[];
}

export const bookingApi = {
  createBooking: async (bookingData: BookingData) => {
    try {
      console.log('Creating booking with data:', bookingData);
      const response = await api.post('/create-booking', bookingData);
      console.log('Booking created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating booking:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to create booking');
    }
  },

  getMyBookings: async (): Promise<Booking[]> => {
    try {
      console.log('Fetching user bookings...');
      const response = await api.get('/my-bookings');
      console.log('Raw bookings response:', response.data);
      
      if (!response.data.bookings) {
        console.log('No bookings found in response');
        return [];
      }
      
      // Process the bookings data to parse images and format properly
      const processedBookings = response.data.bookings.map((booking: any) => {
        let parsedImages = [];
        try {
          if (booking.images && typeof booking.images === 'string') {
            parsedImages = JSON.parse(booking.images);
          } else if (Array.isArray(booking.images)) {
            parsedImages = booking.images;
          }
        } catch (e) {
          console.warn('Failed to parse booking images:', e);
          parsedImages = [];
        }

        return {
          ...booking,
          images: parsedImages.map((img: string) => 
            img.startsWith('http') ? img : `https://admin.bookvenue.app/${img}`
          )
        };
      });

      console.log('Processed bookings:', processedBookings);
      return processedBookings;
    } catch (error: any) {
      console.error('Error fetching bookings:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
    }
  },

  getBookingById: async (bookingId: string) => {
    try {
      const response = await api.get(`/booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching booking:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to fetch booking');
    }
  },

  getCourtAvailability: async (facilityId: string, courtId: string, date: string) => {
    try {
      console.log('Fetching availability for:', { facilityId, courtId, date });
      const response = await api.get(`/court-availability`, {
        params: {
          facility_id: facilityId,
          court_id: courtId,
          date: date
        }
      });
      console.log('Availability response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching availability:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to fetch availability');
    }
  },

  cancelBooking: async (bookingId: string) => {
    try {
      const response = await api.post(`/cancel-booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling booking:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
  },

  paymentSuccess: async (paymentData: {
    order_id: string;
    payment_id: string;
    signature?: string;
  }) => {
    try {
      console.log('Confirming payment:', paymentData);
      const response = await api.post('/payment-success', paymentData);
      console.log('Payment confirmed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error confirming payment:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to confirm payment');
    }
  }
};