import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy 
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
