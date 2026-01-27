import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  documentId
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

const USERS_COLLECTION = 'users';

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      department: data.department,
      year: data.year,
      createdAt: data.createdAt?.toDate() || new Date(),
      photoURL: data.photoURL,
    };
  });
};

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  await updateDoc(doc(db, USERS_COLLECTION, userId), { role: newRole });
};

export const deleteUser = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
};

export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  if (!userIds || userIds.length === 0) return [];

  // Firestore IN query limited to 10-30 items depending on version, 
  // but let's assume notice views won't be massive for now or we can chunk.
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  const allFoundUsers: User[] = [];
  for (const chunk of chunks) {
    const q = query(collection(db, USERS_COLLECTION), where(documentId(), 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      allFoundUsers.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        department: data.department,
        year: data.year,
        createdAt: data.createdAt?.toDate() || new Date(),
        photoURL: data.photoURL,
      });
    });
  }
  return allFoundUsers;
};
