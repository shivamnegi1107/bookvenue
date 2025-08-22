import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Clock, CreditCard, ArrowRight, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { bookingApi } from '../../api/bookingApi';

interface Booking {
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

export default function BookingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadBookings();
    }
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('Loading bookings for user:', user?.id);
      const bookingsData = await bookingApi.getMyBookings();
      console.log('Bookings loaded:', bookingsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    // If it's in HH:MM:SS format, extract HH:MM
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString.substring(0, 5);
    }
    
    // If it's a timestamp or other format, try to parse and format
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const handleBookingPress = (booking: Booking) => {
    // Navigate to venue detail page for rebooking using facility_slug
    router.push(`/venue/${booking.facility_slug}`);
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPromptContainer}>
          <User size={64} color="#6B7280" />
          <Text style={styles.authPromptTitle}>Login Required</Text>
          <Text style={styles.authPromptText}>
            Please login to view your bookings and manage your reservations.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your venue reservations</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : bookings.length > 0 ? (
          <View style={styles.bookingsContainer}>
            {bookings.map((booking) => (
              <TouchableOpacity
                key={booking.bookingId}
                style={styles.bookingCard}
                onPress={() => handleBookingPress(booking)}
              >
                <View style={styles.bookingHeader}>
                  <Image
                    source={{ 
                      uri: booking.facility_image.startsWith('http') 
                        ? booking.facility_image 
                        : `https://admin.bookvenue.app/${booking.facility_image}` 
                    }}
                    style={styles.venueImage}
                  />
                  <View style={styles.bookingInfo}>
                    <Text style={styles.venueName}>{booking.facility}</Text>
                    <View style={styles.courtContainer}>
                      <Text style={styles.courtType}>{booking.court}</Text>
                    </View>
                    <View style={styles.locationContainer}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        Venue Location
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status}
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#6B7280" />
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                  </View>
                  
                  {booking.slots && booking.slots.length > 0 && (
                    <View style={styles.detailItem}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {booking.slots.map(slot => formatTime(slot.time || slot)).join(', ')}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailItem}>
                    <CreditCard size={16} color="#6B7280" />
                    <Text style={styles.detailText}>₹{booking.price}</Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingId}>Booking #{booking.bookingId}</Text>
                  <Text style={styles.rebookText}>Tap to rebook</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyStateText}>
              Start exploring venues and make your first booking!
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Venues</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontFamily: 'Inter-Medium',
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authPromptTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  bookingsContainer: {
    padding: 20,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  courtContainer: {
    marginBottom: 4,
  },
  courtType: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Medium',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  bookingId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Medium',
  },
  rebookText: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  exploreButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});