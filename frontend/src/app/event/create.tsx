import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventService, CreateEventRequest } from '@/features/events/eventService';
import { LocationPicker } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { SPORTS } from '@/constants/sports';

type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'NONE', label: 'Aucune' },
  { value: 'DAILY', label: 'Quotidien' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'BIWEEKLY', label: 'Bi-hebdomadaire' },
  { value: 'MONTHLY', label: 'Mensuel' },
];

export default function CreateEventScreen() {
  const queryClient = useQueryClient();

  // Form state
  const [sport, setSport] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // +1 hour
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE');
  const [isPublic, setIsPublic] = useState(true);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

  const createMutation = useMutation({
    mutationFn: eventService.createEvent,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      Alert.alert('Succès', 'Événement créé avec succès !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const handleSubmit = () => {
    if (!sport) {
      Alert.alert('Erreur', 'Veuillez sélectionner un sport');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const eventData: CreateEventRequest = {
      sport,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      location: location?.address,
      latitude: location?.latitude,
      longitude: location?.longitude,
      date: date.toISOString().split('T')[0],
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      recurrence,
      isPublic,
    };

    createMutation.mutate(eventData);
  };

  const formatTime = (d: Date): string => {
    return d.toTimeString().slice(0, 5);
  };

  const formatDateDisplay = (d: Date): string => {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimeDisplay = (d: Date): string => {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedSport = SPORTS.find((s) => s.key === sport);
  const selectedRecurrence = RECURRENCE_OPTIONS.find((r) => r.value === recurrence);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvel événement</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sport Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Sport *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowSportPicker(!showSportPicker)}
            >
              {selectedSport ? (
                <View style={styles.pickerContent}>
                  <Ionicons name={selectedSport.icon} size={20} color={selectedSport.color} />
                  <Text style={styles.pickerText}>{selectedSport.label}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Sélectionner un sport</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>

            {showSportPicker && (
              <View style={styles.optionsList}>
                {SPORTS.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.option, sport === s.key && styles.optionSelected]}
                    onPress={() => {
                      setSport(s.key);
                      setShowSportPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons name={s.icon} size={20} color={s.color} />
                    <Text
                      style={[styles.optionText, sport === s.key && styles.optionTextSelected]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Titre (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Session running débutants"
              placeholderTextColor={theme.colors.text.tertiary}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre événement..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.pickerText}>{formatDateDisplay(date)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* Time - Horaires */}
          <View style={styles.section}>
            <Text style={styles.label}>Horaires *</Text>
            <View style={styles.timeContainer}>
              {/* Start Time */}
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  setShowEndTimePicker(false);
                  setShowStartTimePicker(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.timeIconContainer}>
                  <Ionicons name="play-circle" size={20} color={theme.colors.success} />
                </View>
                <View style={styles.timeContent}>
                  <Text style={styles.timeLabel}>Début</Text>
                  <Text style={styles.timeValue}>{formatTimeDisplay(startTime)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
              </TouchableOpacity>

              <View style={styles.timeSeparator}>
                <View style={styles.timeLine} />
                <Ionicons name="arrow-down" size={16} color={theme.colors.text.tertiary} />
                <View style={styles.timeLine} />
              </View>

              {/* End Time */}
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.timeIconContainer, { backgroundColor: `${theme.colors.error}15` }]}>
                  <Ionicons name="stop-circle" size={20} color={theme.colors.error} />
                </View>
                <View style={styles.timeContent}>
                  <Text style={styles.timeLabel}>Fin</Text>
                  <Text style={styles.timeValue}>{formatTimeDisplay(endTime)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Start Time Picker */}
            {showStartTimePicker && (
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerHeaderText}>Heure de début</Text>
                  <TouchableOpacity
                    onPress={() => setShowStartTimePicker(false)}
                    style={styles.pickerDoneButton}
                  >
                    <Text style={styles.pickerDoneText}>OK</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) setStartTime(selectedTime);
                  }}
                  style={styles.timePicker}
                />
              </View>
            )}

            {/* End Time Picker */}
            {showEndTimePicker && (
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerHeaderText}>Heure de fin</Text>
                  <TouchableOpacity
                    onPress={() => setShowEndTimePicker(false)}
                    style={styles.pickerDoneButton}
                  >
                    <Text style={styles.pickerDoneText}>OK</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) setEndTime(selectedTime);
                  }}
                  style={styles.timePicker}
                />
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Localisation</Text>
            <LocationPicker
              value={location || undefined}
              onChange={setLocation}
              placeholder="Où se déroule l'événement ?"
            />
          </View>

          {/* Recurrence */}
          <View style={styles.section}>
            <Text style={styles.label}>Récurrence</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowRecurrencePicker(!showRecurrencePicker)}
            >
              <Ionicons name="repeat" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.pickerText}>{selectedRecurrence?.label}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>

            {showRecurrencePicker && (
              <View style={styles.optionsList}>
                {RECURRENCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, recurrence === option.value && styles.optionSelected]}
                    onPress={() => {
                      setRecurrence(option.value);
                      setShowRecurrencePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        recurrence === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Public/Private */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Événement public</Text>
                <Text style={styles.switchDescription}>
                  Les événements publics sont visibles par tous
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={(value) => {
                  setIsPublic(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}50` }}
                thumbColor={isPublic ? theme.colors.primary : theme.colors.text.tertiary}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            activeOpacity={0.8}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={theme.colors.text.inverse} />
                <Text style={styles.submitButtonText}>Créer l'événement</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.tertiary,
  },
  optionsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionSelected: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  optionText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchDescription: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
  // Time picker styles
  timeContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  timeSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  timeLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  pickerHeaderText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  pickerDoneButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  pickerDoneText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.inverse,
  },
  timePicker: {
    height: 150,
  },
});
