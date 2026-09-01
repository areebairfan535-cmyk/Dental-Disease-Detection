import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackendService from '../../services/BackendService';

type Appointment = {
  id: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  slot?: string;
  condition?: string;
  status?: string;
  bookedAt?: string;
  title?: string;
  dentist_name?: string;
  clinic_name?: string;
  appointment_date?: string;
};

const doctorList = [
  { id: 'dr-sami', name: 'Dr. Sami Ali', specialty: 'Restorative Dentist', availability: 'Tomorrow 10:00 AM' },
  { id: 'dr-nida', name: 'Dr. Nida Khan', specialty: 'Family Dentist', availability: 'Monday 2:00 PM' },
  { id: 'dr-ahmed', name: 'Dr. Ahmed Rehan', specialty: 'Periodontist', availability: 'Today 4:00 PM' },
  { id: 'dr-zara', name: 'Dr. Zara Faisal', specialty: 'Oral Health Specialist', availability: 'Wednesday 11:00 AM' },
];

const slots = ['Tomorrow 10:00 AM', 'Monday 2:00 PM', 'Wednesday 11:00 AM', 'Friday 9:30 AM'];

export default function AppointmentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const doctorParam = Array.isArray(params.doctor) ? params.doctor[0] : params.doctor;
  const conditionParam = Array.isArray(params.condition) ? params.condition[0] : params.condition;
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorParam || doctorList[0].id);
  const [selectedSlot, setSelectedSlot] = useState(slots[0]);
  const [condition, setCondition] = useState(conditionParam ? decodeURIComponent(conditionParam) : '');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedDoctor = doctorList.find((doctor) => doctor.id === selectedDoctorId) || doctorList[0];

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await BackendService.getAppointments();
        if (response.ok && response.data?.appointments) {
          setAppointments(response.data.appointments);
        }
      } catch (error) {
        console.error('Load appointments error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, []);

  const handleBookAppointment = async () => {
    if (!selectedDoctor) {
      return;
    }

    const appointmentPayload = {
      title: `Appointment with ${selectedDoctor.name}`,
      description: condition ? `Dental issue detected: ${condition}` : 'Dental appointment',
      appointment_date: selectedSlot,
      appointment_time: selectedSlot,
      dentist_name: selectedDoctor.name,
      clinic_name: 'Dental Care Clinic',
      location: 'Local Dental Center',
      contact_number: '0300-0000000',
      notes: `Booked via app for ${condition || 'general dental care'}`,
    };

    try {
      const response = await BackendService.createAppointment(appointmentPayload);

      if (response.ok && response.data?.success) {
        const newAppointment: Appointment = {
          id: response.data.appointment_id?.toString() || Date.now().toString(),
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          specialty: selectedDoctor.specialty,
          slot: selectedSlot,
          condition: condition || 'Dental checkup',
          status: 'Confirmed',
          bookedAt: new Date().toLocaleString(),
        };
        setAppointments([newAppointment, ...appointments]);
        setMessage(`Appointment booked with ${selectedDoctor.name} on ${selectedSlot}.`);
      } else {
        const message = response.data?.error || response.data?.message || 'Unable to book appointment';
        setMessage(message);
      }
    } catch (error) {
      console.error('Book appointment error:', error);
      setMessage('Unable to book appointment.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Book Appointment</Text>
      {condition ? <Text style={styles.subtitle}>Detected condition: {condition}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Choose D0ctorr</Text>
        {doctorList.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={[styles.doctorOption, selectedDoctorId === doctor.id && styles.activeOption]}
            onPress={() => setSelectedDoctorId(doctor.id)}
          >
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
            <Text style={styles.doctorAvailability}>{doctor.availability}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Slot</Text>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.slotOption, selectedSlot === slot && styles.activeSlot]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text style={styles.slotText}>{slot}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>

      {message.length > 0 ? <Text style={styles.successMessage}>{message}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Appointments</Text>
        {loading ? (
          <Text style={styles.appointmentEmpty}>Loading appointments...</Text>
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentDoctor}>{appointment.title || appointment.dentist_name || 'Appointment'}</Text>
              <Text style={styles.appointmentText}>{appointment.dentist_name || appointment.clinic_name || appointment.specialty}</Text>
              <Text style={styles.appointmentText}>{appointment.appointment_date || appointment.slot}</Text>
              <Text style={styles.appointmentStatus}>{appointment.status || 'Scheduled'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.appointmentEmpty}>No appointments booked yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#eef7ff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e88e5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e51ec7',
    marginBottom: 12,
  },
  doctorOption: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#fdf8ff',
  },
  activeOption: {
    borderColor: '#1e88e5',
    backgroundColor: '#e3f2fd',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0da195',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#616161',
    marginTop: 4,
  },
  doctorAvailability: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  slotOption: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d7dbff',
    backgroundColor: '#f7f8ff',
  },
  activeSlot: {
    borderColor: '#1e88e5',
    backgroundColor: '#eaf4ff',
  },
  slotText: {
    fontSize: 15,
    color: '#263238',
  },
  bookButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    color: '#2e7d32',
    fontSize: 14,
    marginBottom: 16,
  },
  appointmentCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e8d9',
    backgroundColor: '#f6fff6',
    marginBottom: 12,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  appointmentText: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  appointmentStatus: {
    fontSize: 13,
    color: '#2e7d32',
    marginTop: 4,
    fontWeight: '600',
  },
  appointmentEmpty: {
    color: '#757575',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
