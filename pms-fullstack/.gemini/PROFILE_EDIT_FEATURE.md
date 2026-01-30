# Profile Edit Feature with Role-Based Access Control

## Summary
Implemented a complete profile editing system with a modal form and role-based restrictions for updating user information.

## Features Implemented

### **Frontend - Edit Profile Modal**

#### **Modal UI Components:**
1. **Gradient Header**
   - Edit icon with title
   - Close button (X)
   - Subtitle describing the action

2. **Form Fields:**
   - **Full Name** (Required) - Text input
   - **Email Address** (Required) - Email input with validation
   - **Role** - Dropdown (conditionally editable)

3. **Action Buttons:**
   - **Cancel** - Closes modal without saving
   - **Save Changes** - Submits the form

#### **Role-Based UI Restrictions:**

**For ADMIN and MANAGER:**
- ✅ Can edit all fields including role
- ✅ Role dropdown is enabled
- ✅ Can select from: Admin, Manager, Employee, Customer

**For EMPLOYEE and CUSTOMER:**
- ✅ Can edit their own name and email
- ❌ Cannot change their role
- ℹ️ Role field is displayed as read-only (grayed out)
- ℹ️ Warning message: "Only Admins and Managers can change roles"
- ℹ️ Info banner: "You can only edit your name and email. Contact an Admin or Manager to change your role."

### **Backend - API Endpoint**

**Route:** `PUT /api/v1/users/:id`

**Authentication:** Required (via JWT token)

**Access Control Logic:**

1. **Own Profile:**
   - All users can edit their own name and email
   - Only ADMIN and MANAGER can change their own role

2. **Other Users' Profiles:**
   - Only ADMIN and MANAGER can edit other users
   - EMPLOYEE and CUSTOMER cannot edit other users

3. **Role Changes:**
   - Only ADMIN and MANAGER can change any user's role
   - EMPLOYEE and CUSTOMER cannot change roles (even their own)

**Validation:**
- ✅ User existence check
- ✅ Email uniqueness validation
- ✅ Permission verification
- ✅ Input sanitization (trim whitespace)

**Error Handling:**
- 404: User not found
- 400: Email already in use
- 403: Insufficient permissions
- 500: Server error

### **Security Features**

1. **JWT Authentication**
   - All requests require valid authentication token
   - User identity verified from token

2. **Role-Based Authorization**
   - Server-side permission checks
   - Cannot be bypassed from frontend

3. **Data Validation**
   - Email format validation
   - Duplicate email prevention
   - Required field enforcement

4. **Input Sanitization**
   - Whitespace trimming
   - XSS prevention through React

### **User Experience**

**Success Flow:**
1. Click "Edit Profile" from dropdown
2. Modal opens with current user data pre-filled
3. Modify desired fields
4. Click "Save Changes"
5. Success alert appears
6. Page reloads to reflect changes
7. Modal closes

**Error Flow:**
1. If validation fails → Error message displayed in modal
2. If API fails → Error message with retry option
3. If unauthorized → Permission denied message

**Visual Feedback:**
- Loading state: "Saving..." button text
- Disabled buttons during submission
- Error messages in red banner
- Success alert on completion

### **Technical Implementation**

**Frontend State Management:**
```javascript
const [showEditModal, setShowEditModal] = useState(false);
const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    role: ''
});
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState('');
```

**Backend Database Query:**
```javascript
await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
    }
});
```

## Permission Matrix

| User Role | Edit Own Name/Email | Edit Own Role | Edit Others' Name/Email | Edit Others' Role |
|-----------|---------------------|---------------|-------------------------|-------------------|
| ADMIN     | ✅ Yes              | ✅ Yes        | ✅ Yes                  | ✅ Yes            |
| MANAGER   | ✅ Yes              | ✅ Yes        | ✅ Yes                  | ✅ Yes            |
| EMPLOYEE  | ✅ Yes              | ❌ No         | ❌ No                   | ❌ No             |
| CUSTOMER  | ✅ Yes              | ❌ No         | ❌ No                   | ❌ No             |

## API Request/Response Examples

### **Request:**
```http
PUT /api/v1/users/user-id-here
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "fullName": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "MANAGER"
}
```

### **Success Response:**
```json
{
  "id": "user-id-here",
  "fullName": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "MANAGER",
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

### **Error Response (Insufficient Permissions):**
```json
{
  "message": "Only Admins and Managers can change user roles"
}
```

### **Error Response (Email Taken):**
```json
{
  "message": "Email is already in use"
}
```

## Files Modified

### Frontend:
- `frontend/src/layouts/DashboardLayout.jsx`
  - Added edit modal UI
  - Added form state management
  - Added role-based UI restrictions
  - Added API integration

### Backend:
- `backend/src/routes/users.js`
  - Added PUT endpoint for user updates
  - Implemented role-based access control
  - Added validation logic
  - Added error handling

## Testing Checklist

### As ADMIN:
- [x] Edit own profile (name, email, role)
- [x] Edit other users' profiles
- [x] Change any user's role
- [x] See role dropdown enabled

### As MANAGER:
- [x] Edit own profile (name, email, role)
- [x] Edit other users' profiles
- [x] Change any user's role
- [x] See role dropdown enabled

### As EMPLOYEE:
- [x] Edit own name and email
- [x] See role field as read-only
- [x] See permission notice
- [x] Cannot edit other users

### As CUSTOMER:
- [x] Edit own name and email
- [x] See role field as read-only
- [x] See permission notice
- [x] Cannot edit other users

### Validation Tests:
- [x] Empty name → Error
- [x] Empty email → Error
- [x] Duplicate email → Error
- [x] Invalid email format → Browser validation
- [x] Unauthorized role change → Error

## Future Enhancements (Optional)

1. **Password Change**
   - Add password field to edit modal
   - Require current password for verification

2. **Profile Picture Upload**
   - Add image upload functionality
   - Store in cloud storage (e.g., AWS S3)

3. **Email Verification**
   - Send verification email on email change
   - Require confirmation before update

4. **Audit Log**
   - Track who changed what and when
   - Display change history

5. **Bulk User Management**
   - Allow admins to edit multiple users at once
   - Import/export user data

The profile edit feature is now fully functional with proper role-based access control! 🎉
