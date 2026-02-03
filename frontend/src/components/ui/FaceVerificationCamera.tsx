import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/features/shared/styles/theme';

interface FaceVerificationCameraProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  isVerifying?: boolean;
}

export function FaceVerificationCamera({
  visible,
  onClose,
  onCapture,
  isVerifying = false,
}: FaceVerificationCameraProps) {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
          exif: false,
        });

        if (photo?.base64) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);
        }
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error('Error taking picture:', error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage && !isVerifying) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCapture(capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    onClose();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.colors.text.secondary} />
          <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
          <Text style={styles.permissionText}>
            Pour vérifier votre identité, nous avons besoin d'accéder à votre caméra.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vérification d'identité</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Camera or Preview */}
        {capturedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.preview} />

            {isVerifying ? (
              <View style={styles.verifyingOverlay}>
                <View style={styles.verifyingContent}>
                  <View style={styles.verifyingIconContainer}>
                    <Ionicons name="scan" size={48} color={theme.colors.primary} />
                  </View>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.verifyingSpinner}
                  />
                  <Text style={styles.verifyingText}>Analyse en cours...</Text>
                  <Text style={styles.verifyingSubtext}>
                    Vérification de votre visage et de votre âge
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                  <Ionicons name="refresh" size={24} color={theme.colors.text.inverse} />
                  <Text style={styles.actionButtonText}>Reprendre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
                  <Ionicons name="checkmark" size={24} color={theme.colors.text.inverse} />
                  <Text style={styles.actionButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
            {/* Face guide overlay - positioned absolutely over camera */}
            <View style={styles.faceGuide}>
              <View style={styles.faceOval} />
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Placez votre visage dans le cadre
              </Text>
              <Text style={styles.instructionSubtext}>
                Assurez-vous d'être bien éclairé
              </Text>
            </View>

            {/* Capture button */}
            <View style={styles.captureContainer}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          <Text style={styles.footerText}>
            Votre photo est utilisée uniquement pour vérifier votre âge et votre identité.
            Elle ne sera pas stockée.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'black',
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  placeholder: {
    width: 44,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  permissionTitle: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  permissionText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  permissionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  cancelButton: {
    padding: theme.spacing.md,
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  faceGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 250,
    height: 320,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  instructions: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  instructionSubtext: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.text.inverse,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.text.inverse,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  verifyingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(66, 165, 245, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  verifyingSpinner: {
    marginBottom: theme.spacing.md,
  },
  verifyingText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
  },
  verifyingSubtext: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.sm,
    textAlign: 'center',
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  retakeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  confirmButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'black',
    gap: theme.spacing.sm,
  },
  footerText: {
    flex: 1,
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.xs,
  },
});
