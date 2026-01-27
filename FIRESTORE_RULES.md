# Firebase Security Rules Requirement

The "Seen By" functionality requires specific permissions in the Firebase Console. Please add these rules to your Firestore security settings:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing users collection (assumed)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Notices collection
    match /notices/{noticeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'
      );
      // Allow editors (admins/teachers) to full write
      allow update, delete: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'
      );
      // Specifically allow students to increment the viewCount
      allow update: if request.auth != null && 
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount']);
    }

    // IMPORTANT: Required for "Seen By" tracking
    match /notice_views/{viewId} {
      allow get: if request.auth != null;
      allow list: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      // Views should not be edited or deleted by users
      allow update, delete: if false; 
    }
  }
}
```

## How to apply:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **college-notice-board-dc362**.
3. Go to **Firestore Database** > **Rules**.
4. Paste the code above and click **Publish**.

# Firestore Index Requirement

The "Seen By" query sorts views by time for each notice. This requires a **Composite Index**.

## How to create:
1. Click the link provided in your browser console error (the one starting with `https://console.firebase.google.com...`).
2. Alternatively, go to the [Firebase Console](https://console.firebase.google.com/).
3. Navigate to **Firestore Database** > **Indexes**.
4. Click **Create Index**.
5. Enter the following details:
   - **Collection ID**: `notice_views`
   - **Fields to index**:
     - `noticeId`: Ascending
     - `seenAt`: Descending
   - **Query scope**: Collection
6. Click **Create**.

> [!NOTE]
> It may take a few minutes for the index to be ready. The error will disappear once the index is active.
