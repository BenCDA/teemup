import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/features/auth/AuthContext';
import { theme } from '@/features/shared/styles/theme';

const PRO_FEATURES = [
  {
    icon: 'cash-outline' as const,
    title: 'Événements payants',
    description: 'Créez des événements avec inscription payante',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Badge Pro',
    description: 'Affichez votre statut Pro sur votre profil',
  },
  {
    icon: 'stats-chart-outline' as const,
    title: 'Statistiques avancées',
    description: 'Suivez vos performances et participants',
  },
  {
    icon: 'star-outline' as const,
    title: 'Priorité de recherche',
    description: 'Vos événements apparaissent en premier',
  },
  {
    icon: 'people-outline' as const,
    title: 'Groupes illimités',
    description: 'Créez autant de groupes que vous voulez',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Support prioritaire',
    description: 'Assistance dédiée sous 24h',
  },
];

export default function SubscriptionScreen() {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const isPro = user?.isPro || false;

  const handleUpgrade = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Passer Pro',
      'L\'abonnement Pro coûte 9,99€/mois. Vous aurez accès à toutes les fonctionnalités premium.\n\n(Simulation - aucun paiement réel)',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setIsUpgrading(true);
            try {
              // Simuler un délai de paiement puis mettre à jour le statut Pro
              await new Promise(resolve => setTimeout(resolve, 1500));
              await updateUser({ isPro: true });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                '🎉 Félicitations !',
                'Vous êtes maintenant un membre Pro ! Profitez de toutes les fonctionnalités premium.',
                [{ text: 'Super !', onPress: () => router.back() }]
              );
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
            } finally {
              setIsUpgrading(false);
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Gérer l\'abonnement',
      'Votre abonnement Pro est actif.\n\nRenouvellement: 15 février 2026\nPrix: 9,99€/mois',
      [
        { text: 'OK' },
        {
          text: 'Annuler l\'abonnement',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Annuler l\'abonnement',
              'Êtes-vous sûr de vouloir annuler votre abonnement Pro ? Vous perdrez l\'accès aux fonctionnalités premium.',
              [
                { text: 'Non', style: 'cancel' },
                { text: 'Oui, annuler', style: 'destructive' },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Banner */}
        <LinearGradient
          colors={isPro ? ['#FFD700', '#FFA500'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proBanner}
        >
          <View style={styles.proIconContainer}>
            <Ionicons
              name={isPro ? 'shield-checkmark' : 'rocket'}
              size={40}
              color="#fff"
            />
          </View>
          <Text style={styles.proBannerTitle}>
            {isPro ? 'Vous êtes Pro !' : 'Passez Pro'}
          </Text>
          <Text style={styles.proBannerSubtitle}>
            {isPro
              ? 'Profitez de toutes les fonctionnalités premium'
              : 'Débloquez tout le potentiel de TeemUp'}
          </Text>
          {isPro && (
            <View style={styles.proBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </LinearGradient>

        {/* Price Card */}
        {!isPro && (
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Abonnement mensuel</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>€</Text>
              <Text style={styles.priceAmount}>9</Text>
              <Text style={styles.priceDecimal}>,99</Text>
              <Text style={styles.pricePeriod}>/mois</Text>
            </View>
            <Text style={styles.priceNote}>Sans engagement • Annulable à tout moment</Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>
            {isPro ? 'Vos avantages Pro' : 'Ce qui est inclus'}
          </Text>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, isPro && styles.featureIconPro]}>
                <Ionicons
                  name={feature.icon}
                  size={22}
                  color={isPro ? '#FFD700' : theme.colors.primary}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              {isPro && (
                <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
              )}
            </View>
          ))}
        </View>

        {/* Comparison */}
        {!isPro && (
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Comparaison</Text>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonHeaderCell}>Fonctionnalité</Text>
                <Text style={styles.comparisonHeaderCell}>Gratuit</Text>
                <Text style={[styles.comparisonHeaderCell, styles.comparisonHeaderPro]}>Pro</Text>
              </View>
              {[
                ['Événements gratuits', true, true],
                ['Événements payants', false, true],
                ['Badge Pro', false, true],
                ['Statistiques', false, true],
                ['Groupes illimités', false, true],
              ].map(([feature, free, pro], index) => (
                <View key={index} style={styles.comparisonRow}>
                  <Text style={styles.comparisonCell}>{feature}</Text>
                  <View style={styles.comparisonCellCenter}>
                    <Ionicons
                      name={free ? 'checkmark' : 'close'}
                      size={18}
                      color={free ? '#22C55E' : theme.colors.text.tertiary}
                    />
                  </View>
                  <View style={[styles.comparisonCellCenter, styles.comparisonCellPro]}>
                    <Ionicons
                      name={pro ? 'checkmark' : 'close'}
                      size={18}
                      color={pro ? '#22C55E' : theme.colors.text.tertiary}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA Button */}
      <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.ctaButton, isPro && styles.ctaButtonManage]}
          onPress={isPro ? handleManageSubscription : handleUpgrade}
          disabled={isUpgrading}
          activeOpacity={0.8}
        >
          {isUpgrading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isPro ? 'settings-outline' : 'rocket'}
                size={20}
                color="#fff"
              />
              <Text style={styles.ctaButtonText}>
                {isPro ? 'Gérer mon abonnement' : 'Passer Pro maintenant'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  proBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  proIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  proBannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  proBannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  proBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  priceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 60,
  },
  priceDecimal: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  pricePeriod: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 20,
    marginLeft: 4,
  },
  priceNote: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginTop: 12,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIconPro: {
    backgroundColor: '#FFD70020',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  comparisonTable: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  comparisonHeaderCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  comparisonHeaderPro: {
    color: theme.colors.primary,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  comparisonCell: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  comparisonCellCenter: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonCellPro: {
    backgroundColor: `${theme.colors.primary}08`,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  ctaButtonManage: {
    backgroundColor: '#FFD700',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
