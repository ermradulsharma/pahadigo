# Endpoint:- /auth/verify, /auth/apple, /auth/facebook, /auth/google, /vendor/me, /traveller/me

```
{
    "success": true,
    "message": "Authentication successful. Welcome back.",
    "data": {
        "id": "",
        "name": "",
        "email": "",
        "phone": "",
        "profileImage": null,
        "gender": "",
        "dateOfBirth": "",
        "address": "",
        "location": [],
        "rating": {
            "average": 0,
            "count": 0
        },
        "experience": 0,
        "designation": "",
        "googleId": "",
        "facebookId": "",
        "appleId": "",
        "role": "",
        "tempRole": "",
        "tempExtraData": "",
        "bio": "",
        "isVerified": false,
        "status": "",
        "fcmToken": "",
        "tokens": {
            "accessToken": "",
            "refreshToken": "",
            "accessJti": "",
            "refreshJti": ""
        },
        "isNewUser": false,
        "businessProfileStatus": "",
        "businessProfile": {
            "id": "",
            "ownerName": "",
            "businessName": "",
            "businessNumber": "",
            "businessRegistration": "",
            "gstNumber": "",
            "address": "",
            "location": [],
            "profileImage": "",
            "profileType": "",
            "trustBadge": "",
            "businessAbout": "",
            "createdAt": "",
            "isApproved": false,
            "isOperating": false,
            "status": "",
            "profileStatus": ""
        }
    }
}
```

# Endpoint:- /traveller/wishlist?page=1&limit=10, /packages, /packages/search?lat=76.3234&lng=32.219&page=1&limit=100, /traveller/recent-searches
```
{
  "success": true,
  "message": "Your wishlist has been retrieved.",
  "data":  [
      {
        "wishlistId": "",
        "id": "",
        "title": "",
        "isActive": false,
        "pricing": {
            "basePrice": 0,
            "gst": 0,
            "sellingPrice": 0
        },
        "address": "",
        "location": [],
        "photos": "",
        "category_name": "",
        "category_slug": ""
      }
    ],
    "pagination": {
      "total": 0,
      "page": 0,
      "limit": 0,
      "totalPages": 0
    }
  }
```

# Endpoint:- /vendor/packages?page=1&limit=10
```
{
    "success": true,
    "message": "Data retrieved successfully.",
    "data": {
        "catalogId": "6a665a6291230e19b26c42db",
        "vendorId": "6a6659ba633d69ead79fc72a",
        "items": [
        {
            "id": "",
            "title": "",
            "slug": "",
            "isActive": false,
            "pricing": {
                "basePrice": 0,
                "gst": 0,
                "sellingPrice": 0
            },
            "address": "",
            "location": [],
            "photos": "",
            "category": {
                "id": "",
                "name": "",
                "slug": ""
            }
        }
        ],
        "pagination": {
            "total": 0,
            "page": 0,
            "limit": 0,
            "totalPages": 0
        }
    }
}
```

# Endpoint:- /packages, /packages/search?lat=76.3234&lng=32.219&page=1&limit=100, /traveller/recent-searches
```
{
    "success": true,
    "message": "Package catalog retrieved successfully.",
    "data": {
        "homestay": [
            {
                "id": "",
                "title": "",
                "categoryName": "",
                "categoryId": "",
                "pricing": {
                    "basePrice": 0,
                    "gst": 0,
                    "sellingPrice": 0
                },
                "address": "",
                "location": [],
                "image": "",
                "rating": {
                    "average": 0,
                    "count": 0
                },
                "wishlist": false
            }
        ],
        "pagination": {
            "total": 0,
            "page": 0,
            "limit": 0,
            "totalPages": 0
        }
    }
}
```

# Endpoint: /vendor/package/item/:category/:itemId
{
    "success": true,
    "message": "Data retrieved successfully.",
    "data": {
        "availability": {
            "total": 48,
            "available": 2,
            "occupied": 42,
            "reserved": 4
        },
        "pricing": {
            "basePrice": 1859,
            "gst": 12,
            "discountType": "percentage",
            "discount": 17,
            "sellingPrice": 2082.08,
            "maxGuests": 5,
            "maxAdults": 4,
            "maxChildren": 1,
            "childPrice": 778,
            "extraBedAvailable": false,
            "extraBedPrice": 1614
        },
        "address": "",
        "location": [],
        "details": {
            "type": "Ashram",
            "roomType": "Deluxe Room",
            "bedType": "Double",
            "bathroomType": "Common",
            "checkInTime": "10:00 PM",
            "checkOutTime": "06:00 PM"
        },
        "policies": {
            "cancellationPolicy": "",
            "instructions": "",
            "isCouplesFriendly": false,
            "isPetFriendly": false,
            "isSmokingAllowed": false,
            "isMusicAllowed": false
        },
        "title": "",
        "slug": "",
        "description": "",
        "isActive": false,
        "photos": [
            {
                "url": "",
                "type": "",
                "_id": ""
            },
            {
                "url": "",
                "type": "",
                "_id": ""
            }
        ],
        "amenities": "",
        "mealsIncluded": false,
        "mealType": "",
        "_id": "",
        "createdAt": "",
        "updatedAt": ""
    }
}

{
    "success": true,
    "message": "Your wishlist has been retrieved.",
    "data":  [
            {
                "wishlistId": "6aa4c91923f46f6ff43c89ea",
                "id": "6aa27ab7512323c404ec0fab",
                "title": "Cloud End Forest Lodge",
                "isActive": true,
                "pricing": {
                    "basePrice": 1859,
                    "sellingPrice": 2082.08,
                    "gst": 18
                },
                "address": "Chougan, Near Paragliding Landing Site, Bir Billing, Himachal Pradesh, IN - 176077",
                "location": [
                    76.7176,
                    32.0468
                ],
                "image": "https://res.cloudinary.com/duau4vns4/image/upload/v1789033141/pahadigo/packages/6a9f93a523f46f6ff43b5008/hotel/i9lvaivxdh8lojoq6wqb.webp",
                "category_name": "Hotel",
                "category_slug": "hotel"
            }
        ],
        "pagination": {
            "total": 1,
            "page": 1,
            "limit": 10,
            "totalPages": 1
        }
    }

# Endpoint: /traveller/booking/6a877498815144980a7cb320
```
{
    "success": true,
    "message": "Booking details retrieved.",
    "data": {
        "bookingId": "6a877498815144980a7cb320",
        "bookingCode": "PH-20260820-D433B6A5",
        "status": "completed",
        "paymentStatus": "paid",
        "item": {
            "itemId": "6a6aea00db29c8df826558f4",
            "itemType": "hotel",
            "title": "Paradise viasta",
            "url": "https://res.cloudinary.com/duau4vns4/image/upload/v1785391614/pahadigo/packages/6a6659ba633d69ead79fc72a/hotel/qv9inn1hapfdph5ngqnv.webp"
        },

        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-09-02T00:00:00.000Z",

        "occupancy": {
            "adults": 4,
            "children": 4,
            "includeMe": true,
            "units": 2,
            "guestDetails": [
                {
                    "name": "Maikel jack",
                    "phone": "7017523896"
                }
            ]
        },

        "pricing": {
            "basePrice": 2500,
            "subTotal": 5000,
            "serviceFee": 531,
            "discount": 500,
            "coupon": null,
            "couponAmount": 0,
            "taxRate": 18,
            "tax": 810,
            "total": 5841,
            "currency": "INR"
        },

        "business": {
            "id": "6a6659ba633d69ead79fc72a",
            "ownerName": "Gaurav",
            "businessName": "PahadiGo Travel",
            "businessNumber": "9536489063",
            "trustBadge": "verified",
            "isOperating": true,
            "status": "active",
            "address": "4F4F+9R5, dogi, Uttarakhand",
            "location": {
                "address": "4F4F+9R5, dogi, Uttarakhand",
                "latitude": "30.1054778",
                "longitude": "78.4748076"
            },
            "profileImage": "https://res.cloudinary.com/duau4vns4/image/upload/v1785092537/pahadigo/vendor_profiles/6a66589e633d69ead79fc728/suhnmbnjmr4hrvitt0iu.webp"
        },

        "verification": {
            "startOTP": "660274",
            "isStartVerified": false,
            "endOTP": "501051",
            "isEndVerified": false
        }
    }
}
```

# Endpoint: /traveller/booking 
```
{
    "success": true,
    "message": "Historical reservation records retrieved.",
    "data": [
        {
            "bookingId": "6a877498815144980a7cb320",
            "bookingCode": "PH-20260820-D433B6A5",
            "status": "completed",
            "paymentStatus": "paid",
            "item": {
                "itemId": "6a6aea00db29c8df826558f4",
                "itemType": "hotel",
                "title": "Paradise viasta",
                "image": "https://res.cloudinary.com/duau4vns4/image/upload/v1785391614/pahadigo/packages/6a6659ba633d69ead79fc72a/hotel/qv9inn1hapfdph5ngqnv.webp"
            },
            "startDate": "2026-09-01T00:00:00.000Z",
            "endDate": "2026-09-02T00:00:00.000Z",
            "occupancy": {
                "adults": 4,
                "children": 4,
                "units": 2
            },
            "pricing": {
                "basePrice": 2500,
                "subTotal": 5000,
                "discount": 500,
                "tax": 810,
                "total": 5841,
                "currency": "INR"
            }
        }
    ]
}
```
# Endpoint: /traveller/chat/conversations
```
{
    "success": true,
    "message": "Conversations fetched successfully.",
    "data": [
        {
            "id": "",
            "bookingId": "",
            "bookingCode": "",
            "type": "",
            "traveller": {
                "id": "",
                "name": "",
                "profileImage": ""
            },
            "vendor": {
                "id": "",
                "name": "",
                "profileImage": ""
            },
            "lastMessage": "",
            "lastMessageAt": "",
            "unreadCount": 0
        }
    ]
}
```
