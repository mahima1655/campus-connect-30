import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Notice, NoticeCategory, VisibleTo, UserRole } from '@/types';

const NOTICES_COLLECTION = 'notices';

export const createNotice = async (
  notice: Omit<Notice, 'id' | 'createdAt'>,
  file?: File
): Promise<string> => {
  let attachmentUrl = '';
  let attachmentName = '';
  let attachmentType: 'pdf' | 'image' | undefined;

  if (file) {
    const fileRef = ref(storage, `notices/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    attachmentUrl = await getDownloadURL(fileRef);
    attachmentName = file.name;
    attachmentType = file.type.includes('pdf') ? 'pdf' : 'image';
  }

  const docRef = await addDoc(collection(db, NOTICES_COLLECTION), {
    ...notice,
    attachmentUrl,
    attachmentName,
    attachmentType,
    createdAt: Timestamp.now(),
    expiryDate: notice.expiryDate ? Timestamp.fromDate(notice.expiryDate) : null,
  });

  return docRef.id;
};

export const updateNotice = async (
  noticeId: string,
  updates: Partial<Notice>,
  file?: File
): Promise<void> => {
  const updateData: Record<string, unknown> = { ...updates };
  
  if (file) {
    const fileRef = ref(storage, `notices/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    updateData.attachmentUrl = await getDownloadURL(fileRef);
    updateData.attachmentName = file.name;
    updateData.attachmentType = file.type.includes('pdf') ? 'pdf' : 'image';
  }

  if (updates.expiryDate) {
    updateData.expiryDate = Timestamp.fromDate(updates.expiryDate);
  }

  await updateDoc(doc(db, NOTICES_COLLECTION, noticeId), updateData);
};

export const deleteNotice = async (noticeId: string, attachmentUrl?: string): Promise<void> => {
  if (attachmentUrl) {
    try {
      const fileRef = ref(storage, attachmentUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  }
  await deleteDoc(doc(db, NOTICES_COLLECTION, noticeId));
};

export const subscribeToNotices = (
  userRole: UserRole,
  callback: (notices: Notice[]) => void
): (() => void) => {
  let q = query(
    collection(db, NOTICES_COLLECTION),
    orderBy('isPinned', 'desc'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notices: Notice[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const notice: Notice = {
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        department: data.department,
        visibleTo: data.visibleTo,
        attachmentUrl: data.attachmentUrl,
        attachmentName: data.attachmentName,
        attachmentType: data.attachmentType,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate(),
        isPinned: data.isPinned,
        isApproved: data.isApproved,
      };

      // Filter based on role
      if (userRole === 'admin') {
        notices.push(notice);
      } else if (userRole === 'teacher') {
        notices.push(notice);
      } else {
        // Students can't see staff-only notices
        if (notice.category !== 'staff') {
          notices.push(notice);
        }
      }
    });
    callback(notices);
  });
};

export const getNoticeStats = async (): Promise<{
  total: number;
  byCategory: Record<NoticeCategory, number>;
}> => {
  const snapshot = await getDocs(collection(db, NOTICES_COLLECTION));
  const stats: Record<NoticeCategory, number> = {
    exam: 0,
    sports: 0,
    events: 0,
    hackathons: 0,
    symposium: 0,
    department: 0,
    placement: 0,
    coe: 0,
    office: 0,
    staff: 0,
  };

  snapshot.forEach((doc) => {
    const category = doc.data().category as NoticeCategory;
    stats[category]++;
  });

  return {
    total: snapshot.size,
    byCategory: stats,
  };
};
