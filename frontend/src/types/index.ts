export interface User {
  id: string;
  email?: string; // Only present when viewing own profile
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture?: string;
  coverImage?: string;
  bio?: string;
  sports: string[];
  isOnline: boolean;
  lastSeen?: string;
  createdAt?: string;
  isVerified?: boolean;
  verifiedAge?: number;
  verifiedGender?: 'MALE' | 'FEMALE';
  ageRange?: string; // For public profiles (e.g., "20-24", "25-29")
}

export interface SportEvent {
  id: string;
  userId: string;
  sport: string;
  title?: string;
  description?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  isPublic: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Conversation {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  conversationId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  readBy: string[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  sender: User;
  receiver: User;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export interface Notification {
  id: string;
  fromUser?: User;
  type: 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'NEW_MESSAGE' | 'GROUP_INVITATION' | 'FOLLOW' | 'SYSTEM';
  title: string;
  content?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}

export interface FaceVerificationResponse {
  success: boolean;
  faceDetected: boolean;
  age?: number;
  ageRange?: string;
  gender?: string;
  genderConfidence?: number;
  isAdult: boolean;
  isRealFace: boolean;
  message: string;
}
