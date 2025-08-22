const API_BASE_URL = 'https://bookvenue.in/api';

export interface BookingData {
  venueId: string;
  date: string;
  timeSlots: string[];
  totalPrice: number;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
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

export const createBooking = async (bookingData: BookingData): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/book-venue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getMyBookings = async (): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/my-bookings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Process the bookings data to parse images and format properly
    const processedBookings = data.bookings.map((booking: any) => ({
      ...booking,
      images: typeof booking.images === 'string' 
        ? JSON.parse(booking.images) 
        : booking.images || []
    }));

    return processedBookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const getBookingById = async (bookingId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};