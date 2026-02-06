import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/features/shared/styles/theme';

const FAQ_ITEMS = [
  {
    question: 'Comment créer un événement ?',
    answer: 'Allez dans l\'onglet "Événements" et appuyez sur le bouton "+". Remplissez les informations de votre événement et validez.',
  },
  {
    question: 'Comment trouver des partenaires sportifs ?',
    answer: 'Utilisez l\'onglet "Découvrir" pour parcourir les profils des sportifs près de chez vous. Vous pouvez filtrer par sport.',
  },
  {
    question: 'Comment modifier mon profil ?',
    answer: 'Allez dans l\'onglet "Profil" et appuyez sur l\'icône de modification en haut à droite de votre photo de couverture.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Oui, TeemUp utilise un chiffrement de bout en bout et respecte le RGPD. Vos données ne sont jamais partagées avec des tiers.',
  },
];

export default function HelpScreen() {
  const handleContact = () => {
    Linking.openURL('mailto:support@teemup.app');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Card */}
        <TouchableOpacity style={styles.contactCard} onPress={handleContact} activeOpacity={0.8}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
            <Text style={styles.contactDescription}>
              Notre équipe est là pour vous aider. Contactez-nous par email.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>

        <View style={styles.faqContainer}>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isLast={index === FAQ_ITEMS.length - 1}
            />
          ))}
        </View>

        {/* Links Section */}
        <Text style={styles.sectionTitle}>Informations légales</Text>

        <View style={styles.linksCard}>
          <LinkItem
            icon="document-text-outline"
            title="Conditions d'utilisation"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <LinkItem
            icon="shield-outline"
            title="Politique de confidentialité"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <LinkItem
            icon="information-circle-outline"
            title="À propos de TeemUp"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>TeemUp v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 TeemUp. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
  isLast?: boolean;
}

function FAQItem({ question, answer, isLast }: FAQItemProps) {
  return (
    <View style={[styles.faqItem, !isLast && styles.faqItemBorder]}>
      <View style={styles.faqQuestion}>
        <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
        <Text style={styles.faqQuestionText}>{question}</Text>
      </View>
      <Text style={styles.faqAnswerText}>{answer}</Text>
    </View>
  );
}

interface LinkItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  isLast?: boolean;
}

function LinkItem({ icon, title, onPress }: LinkItemProps) {
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={20} color={theme.colors.text.secondary} />
      <Text style={styles.linkText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  contactDescription: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  faqItem: {
    padding: theme.spacing.md,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  faqQuestionText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  faqAnswerText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginLeft: 28,
  },
  linksCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 52,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  versionText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  copyrightText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
});
