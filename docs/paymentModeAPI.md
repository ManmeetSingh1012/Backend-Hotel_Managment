# PaymentMode API Documentation

This document describes the CRUD operations for PaymentMode management in the Hotel PMS system.

## Base URL
```
/api/payment-modes
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Payment Mode
**POST** `/:hotelId`

Creates a new payment mode for a specific hotel.

**URL Parameters:**
- `hotelId` (UUID, required): The ID of the hotel

**Request Body:**
```json
{
  "paymentMode": "Credit Card"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Payment mode created successfully",
  "data": {
    "id": "uuid-here",
    "createdBy": "user-uuid",
    "hotelId": "hotel-uuid",
    "paymentMode": "Credit Card",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- `paymentMode` is required and must be a non-empty string
- `paymentMode` must be less than 100 characters
- `createdBy` is automatically set from the authenticated user's ID

---

### 2. Get All Payment Modes
**GET** `/:hotelId`

Retrieves all payment modes for a specific hotel.

**URL Parameters:**
- `hotelId` (UUID, required): The ID of the hotel

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment modes retrieved successfully",
  "data": [
    {
      "id": "uuid-1",
      "createdBy": "user-uuid",
      "hotelId": "hotel-uuid",
      "paymentMode": "Credit Card",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "createdBy": "user-uuid",
      "hotelId": "hotel-uuid",
      "paymentMode": "Cash",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 3. Get Payment Mode by ID
**GET** `/:hotelId/:id`

Retrieves a specific payment mode by its ID for a specific hotel.

**URL Parameters:**
- `hotelId` (UUID, required): The ID of the hotel
- `id` (UUID, required): The ID of the payment mode

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment mode retrieved successfully",
  "data": {
    "id": "uuid-here",
    "createdBy": "user-uuid",
    "hotelId": "hotel-uuid",
    "paymentMode": "Credit Card",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Payment mode not found"
}
```

---

### 4. Update Payment Mode
**PUT** `/:hotelId/:id`

Updates an existing payment mode for a specific hotel.

**URL Parameters:**
- `hotelId` (UUID, required): The ID of the hotel
- `id` (UUID, required): The ID of the payment mode

**Request Body:**
```json
{
  "paymentMode": "Updated Payment Mode"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment mode updated successfully",
  "data": {
    "id": "uuid-here",
    "createdBy": "user-uuid",
    "hotelId": "hotel-uuid",
    "paymentMode": "Updated Payment Mode",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Payment mode not found"
}
```

---

### 5. Delete Payment Mode
**DELETE** `/:hotelId/:id`

Deletes a payment mode for a specific hotel.

**URL Parameters:**
- `hotelId` (UUID, required): The ID of the hotel
- `id` (UUID, required): The ID of the payment mode

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment mode deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Payment mode not found"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Payment mode is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access token required",
  "message": "Please provide a valid authentication token"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating payment mode",
  "error": "Database connection error"
}
```

---

## Example Usage

### Using cURL

**Create Payment Mode:**
```bash
curl -X POST http://localhost:5001/api/payment-modes/hotel-uuid-here \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"paymentMode": "Credit Card"}'
```

**Get All Payment Modes:**
```bash
curl -X GET http://localhost:5001/api/payment-modes/hotel-uuid-here \
  -H "Authorization: Bearer your-jwt-token"
```

**Update Payment Mode:**
```bash
curl -X PUT http://localhost:5001/api/payment-modes/hotel-uuid-here/payment-mode-uuid-here \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"paymentMode": "Updated Payment Mode"}'
```

**Delete Payment Mode:**
```bash
curl -X DELETE http://localhost:5001/api/payment-modes/hotel-uuid-here/payment-mode-uuid-here \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header
2. **User Context**: The `createdBy` field is automatically set from the authenticated user's ID
3. **Hotel Scoping**: All operations are scoped to a specific hotel using the `hotelId` parameter
4. **Validation**: Payment mode names are validated for length (max 100 characters) and required field validation
5. **Ordering**: Payment modes are returned in descending order by creation date (newest first) 