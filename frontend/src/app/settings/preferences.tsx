import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { theme } from '@/features/shared/styles/theme';

export default function PreferencesScreen() {
  // Privacy settings
  const [profileVisible, setProfileVisible] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  // Notification settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [messages, setMessages] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [eventUpdates, setEventUpdates] = useState(true);
  const [newEvents, setNewEvents] = useState(false);

  const handleToggle = (setter: (value: boolean) => void) => (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* PRIVACY SECTION */}
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Confidentialité</Text>
        </View>

        <View style={styles.settingCard}>
          <SettingRow
            icon="eye-outline"
            title="Profil visible"
            description="Les autres utilisateurs peuvent voir votre profil"
            value={profileVisible}
            onValueChange={handleToggle(setProfileVisible)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="location-outline"
            title="Afficher ma position"
            description="Montrer votre ville sur votre profil"
            value={showLocation}
            onValueChange={handleToggle(setShowLocation)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="calendar-outline"
            title="Afficher mon âge"
            description="Montrer votre âge sur votre profil"
            value={showAge}
            onValueChange={handleToggle(setShowAge)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubble-outline"
            title="Messages"
            description="Autoriser les autres à vous envoyer des messages"
            value={allowMessages}
            onValueChange={handleToggle(setAllowMessages)}
          />
        </View>

        {/* NOTIFICATIONS SECTION */}
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>

        <View style={styles.settingCard}>
          <SettingRow
            icon="notifications"
            title="Notifications push"
            description="Recevoir des notifications sur votre téléphone"
            value={pushEnabled}
            onValueChange={handleToggle(setPushEnabled)}
            highlight
          />
        </View>

        <Text style={styles.subSectionTitle}>Social</Text>

        <View style={styles.settingCard}>
          <SettingRow
            icon="person-add"
            title="Demandes d'amis"
            description="Nouvelle demande d'ami reçue"
            value={friendRequests}
            onValueChange={handleToggle(setFriendRequests)}
            disabled={!pushEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubble"
            title="Messages"
            description="Nouveau message reçu"
            value={messages}
            onValueChange={handleToggle(setMessages)}
            disabled={!pushEnabled}
          />
        </View>

        <Text style={styles.subSectionTitle}>Événements</Text>

        <View style={styles.settingCard}>
          <SettingRow
            icon="alarm"
            title="Rappels"
            description="Rappel avant le début d'un événement"
            value={eventReminders}
            onValueChange={handleToggle(setEventReminders)}
            disabled={!pushEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="refresh"
            title="Mises à jour"
            description="Modifications sur un événement rejoint"
            value={eventUpdates}
            onValueChange={handleToggle(setEventUpdates)}
            disabled={!pushEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="star"
            title="Nouveaux événements"
            description="Événements correspondant à vos sports"
            value={newEvents}
            onValueChange={handleToggle(setNewEvents)}
            disabled={!pushEnabled}
          />
        </View>

        {!pushEnabled && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              Les notifications push sont désactivées. Activez-les pour ne rien manquer.
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Vos données personnelles sont protégées conformément au RGPD.
            Nous ne partageons jamais vos informations avec des tiers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  highlight?: boolean;
}

function SettingRow({ icon, title, description, value, onValueChange, disabled, highlight }: SettingRowProps) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={[
        styles.settingIconContainer,
        disabled && styles.settingIconDisabled,
        highlight && styles.settingIconHighlight
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={disabled ? theme.colors.text.tertiary : highlight ? theme.colors.success : theme.colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.textDisabled]}>{title}</Text>
        <Text style={[styles.settingDescription, disabled && styles.textDisabled]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.border,
          true: highlight ? `${theme.colors.success}50` : `${theme.colors.primary}50`
        }}
        thumbColor={value && !disabled ? (highlight ? theme.colors.success : theme.colors.primary) : theme.colors.text.tertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  subSectionTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${theme.colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDisabled: {
    backgroundColor: theme.colors.border,
  },
  settingIconHighlight: {
    backgroundColor: `${theme.colors.success}15`,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  settingDescription: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  textDisabled: {
    color: theme.colors.text.tertiary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 60,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
