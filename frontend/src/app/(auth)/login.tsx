import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { Button, Input, AuthLayout } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Erreur de connexion',
        error.response?.data?.message || 'Email ou mot de passe incorrect'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Connexion</Text>

      <View style={styles.signupPrompt}>
        <Text style={styles.signupText}>Pas de compte ? Créez en un </Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.signupLink}>ici.</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="ex: jon.smith@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="********"
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <Button
        title="CONNEXION"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
        style={styles.loginButton}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas encore de compte ?</Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold,
    marginBottom: theme.spacing.sm,
    letterSpacing: theme.typography.letterSpacing.tight,
    color: theme.colors.text.primary,
  },
  signupPrompt: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  signupText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  signupLink: {
    fontSize: theme.typography.size.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.size.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
});
