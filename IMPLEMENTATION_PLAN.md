# TeemUp - Plan d'Implémentation

## Phase 1 : Comptes Pro (2-3 jours)

### Backend
1. [ ] Créer entité `Subscription` (id, userId, plan, startDate, endDate, status)
2. [ ] Migration V5: table `subscriptions`
3. [ ] Endpoint `POST /api/users/upgrade-pro` (simulé)
4. [ ] Endpoint `GET /api/users/subscription`
5. [ ] Ajouter `proSince` et `subscriptionStatus` dans UserResponse

### Frontend
1. [ ] Écran `/settings/subscription.tsx` - Gestion abonnement
2. [ ] Badge Pro sur profil et UserCard
3. [ ] Flow "Passer Pro" avec écran de présentation
4. [ ] Indicateur Pro dans le header profil

---

## Phase 2 : Avatars & Covers (1 jour)

### Avatar dynamique
1. [ ] Créer palette de 8 gradients
2. [ ] Hash-based color selection
3. [ ] Mettre à jour `Avatar.tsx`

### Covers unifiées
1. [ ] Créer `constants/defaultImages.ts`
2. [ ] Mapper tous les sports (25+)
3. [ ] Fallback gradient par sport
4. [ ] Unifier UserCard, Profile, User/[id]

---

## Phase 3 : Messagerie UX (1-2 jours)

### Optimisations critiques
1. [ ] Remplacer `synchronized` par contrainte unique
2. [ ] Batch UPDATE pour read receipts
3. [ ] Paginer `findAllByConversationId`

### UI/UX Messenger-like
1. [ ] Réactions aux messages (emoji)
2. [ ] Réponse à un message
3. [ ] Indicateur "vu" amélioré
4. [ ] Animation d'envoi fluide

---

## Phase 4 : Polish général (1 jour)

1. [ ] Vérifier safe areas sur tous les écrans
2. [ ] Cohérence des spacings/margins
3. [ ] Loading states uniformes
4. [ ] Error states uniformes
5. [ ] Haptics feedback cohérent
