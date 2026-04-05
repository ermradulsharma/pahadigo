# Vendor Closure Management API Guide

This documentation provides the details for the updated closure management API.

## **Endpoint Details**
- **URL**: `{{BASE_URL}}/api/vendor/business/profile/closures`
- **Method**: `POST`
- **Auth**: `Bearer <VENDOR_TOKEN>`
- **Content-Type**: `multipart/form-data` (or JSON)

---

## **1. Single Record Addition (CURL Example)**
Vendor can hit this API multiple times to add multiple closure periods. Each hit creates a new record.

```bash
curl --location 'http://localhost:3000/api/vendor/business/profile/closures' \
--header 'Authorization: Bearer <YOUR_TOKEN>' \
--form 'startDate="2026-10-10"' \
--form 'endDate="2026-10-10"' \
--form 'reason="One day leave"'
```

---

## **2. Response Example (201 Created)**
```json
{
    "status": 201,
    "message": "Business closure range added",
    "data": {
        "_id": "65f123abc...",
        "user": "65e0...",
        "vendor": "65e1...",
        "startDate": "2026-10-10T00:00:00.000Z",
        "endDate": "2026-10-10T23:59:59.999Z",
        "reason": "One day leave",
        "isActive": true
    }
}
```

---

## **3. Other Operations**

### **Get All Closures**
- **Method**: `GET`
- **URL**: `/api/vendor/business/profile/closures`

### **Delete a Closure**
- **Method**: `DELETE`
- **URL**: `/api/vendor/business/profile/closures/:id`

---

> [!IMPORTANT]
> - **Date Normalization**: Even if you send the same date for start and end, the system automatically expands it to cover the full 24 hours (00:00:00 to 23:59:59).
> - **Validation**: You cannot add a closure for a past date.
