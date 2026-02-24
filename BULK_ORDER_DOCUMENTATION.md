# Apartment Bulk Ordering Feature Documentation

## Overview
The Apartment Bulk Ordering feature enables hyperlocal community-based ordering and shared delivery optimization in the KiranaConnect platform.

## Architecture & Components

### Backend Data Models

#### 1. Apartment Model (`models/apartment.js`)
Stores residential apartment/colony information
- **Fields:**
  - `name`: Apartment name (unique)
  - `address`: Full address
  - `area`: Area/zone
  - `city`: City name
  - `postalCode`: Postal code
  - `latitude/longitude`: GPS coordinates for delivery routing
  - `totalFamilies`: Expected number of families
  - `registeredFamilies`: Currently registered families
  - `isActive`: Enable/disable bulk ordering for this apartment
  - `deliveryRadius`: Service radius in km

#### 2. BulkOrderWindow Model (`models/bulkOrderWindow.js`)
Defines time windows for bulk order placement
- **Fields:**
  - `name`: Window name (e.g., "Evening Ordering")
  - `startTime`: Start time (24-hour format)
  - `endTime`: End time (24-hour format)
  - `daysOfWeek`: Days this window is active
  - `apartment`: Reference to Apartment
  - `isActive`: Enable/disable this window
  - `deliveryDate`: Scheduled delivery date

#### 3. BulkOrder Model (`models/bulkOrder.js`)
Groups orders from multiple customers in an apartment
- **Fields:**
  - `bulkOrderId`: Unique identifier (e.g., `BULK-APT-001-20250224`)
  - `apartment`: Reference to Apartment
  - `orderWindow`: Reference to BulkOrderWindow
  - `participatingCustomers`: Array of customer orders
  - `status`: PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
  - `totalFamilies`: Number of participating families
  - `totalItems`: Total items count
  - `totalAmount`: Total order value
  - `deliveryFeeDiscount`: Bulk order discount (₹15 per delivery)
  - `deliveryAgent`: Assigned delivery agent
  - `estimatedDeliveryDate`: Expected delivery date

#### 4. Updated Customer Model (`models/customer.js`)
Added fields for bulk ordering
- `apartment`: Associated apartment (ObjectId)
- `apartmentUnit`: Unit number (e.g., "A-101")
- `enrolledInBulkOrdering`: Boolean flag
- `preferredBulkOrderWindow`: Preferred order window

### Backend APIs (`API/bulkOrder.js`)

#### Customer Endpoints

**GET `/api/bulk-orders/apartments`**
- Gets all active apartments with current bulk order window status
- Returns: List of apartments with real-time window info

**GET `/api/bulk-orders/apartments/:apartmentId`**
- Gets specific apartment details including current bulk order
- Returns: Apartment info, active window, and current bulk order

**POST `/api/bulk-orders/customer/apartment`**
- Updates customer's apartment profile
- Body: `{ customerId, apartmentId, apartmentUnit }`

**POST `/api/bulk-orders/bulk-orders/join`**
- Adds customer's order to current bulk order
- Creates new bulk order if none exists
- Body: `{ customerId, apartmentId, orderId, items, totalAmount, shopId }`

**GET `/api/bulk-orders/bulk-orders/current/:customerId`**
- Gets current bulk order for customer's apartment
- Includes countdown timer info
- Returns: `{ bulkOrder, timeRemaining, windowStart, windowEnd }`

#### Shopkeeper Endpoints

**GET `/api/bulk-orders/shopkeeper/bulk-orders/:shopId`**
- Gets bulk orders assigned to this shop
- Returns: All active bulk orders with customer details

**PATCH `/api/bulk-orders/bulk-orders/:bulkOrderId/status`**
- Updates bulk order preparation status
- Body: `{ status }` (values: CONFIRMED, PREPARING, READY)

#### Delivery Agent Endpoints

**GET `/api/bulk-orders/delivery-agent/bulk-deliveries/:agentId`**
- Gets bulk deliveries assigned to agent
- Returns: Grouped orders ready for delivery

**PATCH `/api/bulk-orders/bulk-orders/:bulkOrderId/assign-agent`**
- Assigns delivery agent to bulk order
- Body: `{ agentId }`
- Sets status to OUT_FOR_DELIVERY

**PATCH `/api/bulk-orders/bulk-orders/:bulkOrderId/delivered`**
- Marks bulk order as delivered
- Updates `actualDeliveryDate`

#### Admin Endpoints

**POST `/api/bulk-orders/admin/apartments`**
- Creates new apartment
- Body: `{ name, address, area, city, postalCode, latitude, longitude, totalFamilies, deliveryRadius }`

**GET `/api/bulk-orders/admin/apartments`**
- Gets all apartments (admin view)
- Includes statistics

**PATCH `/api/bulk-orders/admin/apartments/:apartmentId`**
- Updates apartment configuration
- Body: Any apartment fields to update

**POST `/api/bulk-orders/admin/order-windows`**
- Creates new bulk order time window
- Body: `{ name, startTime, endTime, daysOfWeek, apartmentId }`

**GET `/api/bulk-orders/admin/statistics`**
- Gets aggregate bulk ordering statistics
- Returns: `{ totalBulkOrders, totalApartments, totalParticipants, totalRevenue }`

### Frontend Components

#### 1. BulkOrderCard Component
- Displays real-time bulk order info on customer home page
- Shows:
  - Apartment name
  - Number of participating families
  - Time remaining in order window (countdown)
  - Delivery fee discount
  - "Join Order" and "View Details" buttons
- Animated entrance with pulse effects on icons

#### 2. JoinBulkOrderModal Component
- Confirmation modal for joining bulk order
- Displays:
  - Apartment name
  - Benefits (savings, faster delivery, community)
  - Participation agreement checkbox
  - Join/Cancel buttons

#### 3. Shopkeeper BulkOrders Page
- Dashboard showing grouped apartment orders
- Features:
  - Filter by status (CONFIRMED, PREPARING, READY)
  - View total families, items, and revenue per order
  - Bulk order discount info
  - Update order status
  - Detailed modal showing all customers

#### 4. Delivery Agent BulkDeliveries Page
- Shows all bulk deliveries for the agent
- Features:
  - Route optimization button (sorts by area for efficient delivery)
  - Delivery window display
  - Customer list with apartment units
  - Mark individual/all deliveries as complete
  - Stop numbers for sequential delivery

#### 5. Admin BulkOrderConfig Dashboard
- Configuration and monitoring interface
- Three tabs:
  **Apartments Tab:**
  - List all apartments with statistics
  - Add/Edit/Delete apartments
  - Activation/deactivation toggle
  - Show enrollment percentage
  
  **Order Windows Tab:**
  - Manage bulk order time windows
  - Configure days and times
  - Activate/deactivate windows
  
  **Statistics Tab:**
  - View aggregate metrics
  - Charts for trends (placeholder)
  - Performance analytics

## Integration Guide

### 1. Update Package.json
Ensure backend has necessary dependencies:
```json
{
  "dependencies": {
    "express": "^4.x",
    "mongoose": "^7.x"
  }
}
```

### 2. Register API Routes in Backend
In your main `server.js`:
```javascript
const bulkOrderRoutes = require('./API/bulkOrder');
app.use('/api/bulk-orders', bulkOrderRoutes);
```

### 3. Connect to Database
Ensure MongoDB connection is established in backend before accessing bulk order APIs.

### 4. Update API Layer (Frontend)
Update `src/lib/api.ts` to add bulk order endpoints:
```typescript
export const api = {
  bulkOrders: {
    getApartments: () => axios.get('/api/bulk-orders/apartments'),
    getCurrentOrder: (customerId: string) => axios.get(`/api/bulk-orders/bulk-orders/current/${customerId}`),
    joinOrder: (data: any) => axios.post('/api/bulk-orders/bulk-orders/join', data),
  }
}
```

### 5. Route Configuration
Add routes in your routing config:
```typescript
// Owner/Shopkeeper routes
{ path: '/owner/bulk-orders', component: ShopkeeperBulkOrders }

// Delivery agent routes
{ path: '/delivery-agent/bulk-deliveries', component: DeliveryAgentBulkDeliveries }

// Admin routes
{ path: '/admin/bulk-order-config', component: AdminBulkOrderDashboard }
```

### 6. Environment Variables
Add to `.env` (backend):
```
BULK_ORDER_DISCOUNT=15     # Delivery discount in rupees
BULK_ORDER_MIN_FAMILIES=3  # Minimum families to activate bulk order
```

## User Flows

### Customer Flow
1. Customer signs up → Selects apartment from dropdown
2. Stores profile with apartment unit number
3. On home page, sees **"Bulk Apartment Order"** card during active window
4. Card shows:
   - Apartment name
   - Number of families already joined
   - Minutes remaining in ordering window
   - ₹15 delivery fee discount
5. Clicks **"Join Order"** → Confirmation modal
6. Places order as usual during bulk window
7. Order automatically grouped with other apartment orders
8. Gets delivery fee discount on checkout

### Shopkeeper Flow
1. Logs in to owner dashboard
2. Navigates to **"Bulk Orders"** section
3. Views grouped orders by apartment
4. Sees total families, items, revenue per bulk order
5. Can filter by status (CONFIRMED, PREPARING, READY)
6. Updates status as items are prepared
7. Once ready, marks order as READY for delivery

### Delivery Agent Flow
1. Logs in to delivery dashboard
2. Views **"Bulk Deliveries"** section
3. Clicks **"Optimize Route"** to sort by area
4. Visits each apartment delivery in sequence
5. For each customer:
   - Verifies apartment unit number
   - Marks delivery as complete
6. After all families delivered, marks bulk order DELIVERED

### Admin Flow
1. Logs in to **Admin Dashboard**
2. Goes to **Bulk Order Configuration**
3. **Apartments Tab:**
   - Adds new residential apartments
   - Sets delivery radius
   - Sets total family count
   - Toggle apartment activation
4. **Order Windows Tab:**
   - Creates time windows (e.g., 6 PM - 7 PM)
   - Sets applicable days (Monday-Friday)
   - Can activate/deactivate windows
5. **Statistics Tab:**
   - Views KPIs (total orders, participants, revenue)
   - Monitors enrollment rates
   - Tracks savings given to customers

## Key Features

### For Customers
✅ Save ₹15 on delivery when ordering with neighbors
✅ Real-time countdown timer for order window
✅ See how many families are participating
✅ Automatic order grouping
✅ Transparent delivery benefits

### For Shopkeepers
✅ View orders grouped by apartment
✅ See total items and revenue per bulk order
✅ Update preparation status
✅ Track efficiency gains

### For Delivery Agents
✅ Route optimization for sequential delivery
✅ Multi-unit delivery to same apartment
✅ Delivery fee savings (results in larger orders)
✅ Efficient batch delivery

### For Admins
✅ Configure apartments and order windows
✅ Monitor bulk order metrics
✅ Track adoption and revenue
✅ Enable/disable features by apartment

## Status Workflow
```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
  ↓
(order created after    (after        (ready    (assigned to   (all
 order window closes)    prep starts)   for      delivery agent) families
                                        delivery)               delivered)
```

## Sample Data Flow

1. **Setup Phase:**
   - Admin creates "Prestige Park Apartments"
   - Sets order window: 6 PM - 7 PM, Monday-Friday
   
2. **Ordering Phase (6 PM - 7 PM):**
   - Rajesh (A-101) joins → BulkOrder created
   - Priya (A-102) joins → Added to BulkOrder
   - Amit (B-201) joins → Added to BulkOrder
   - ... more families join
   
3. **Grouping Phase (After 7 PM):**
   - BulkOrder status: CONFIRMED
   - 8 families total
   - ₹3200 total
   - Assigned to shops
   
4. **Preparation Phase:**
   - Shops prepare items
   - Status → PREPARING
   - When done → READY
   
5. **Delivery Phase:**
   - Assigned delivery agent
   - Status → OUT_FOR_DELIVERY
   - Agent visits apartment, delivers to 8 units sequentially
   - Status → DELIVERED

## Benefits

### Business
- Higher order values (bulk orders are larger)
- Improved delivery efficiency (1 vehicle, 1 apartment, multiple families)
- Customer retention (community bonding)
- Reduced delivery costs

### Customer
- Direct delivery fee savings (₹15 minimum)
- Builds community connections
- Reliable order batching

### Environment
- Fewer delivery vehicles needed
- Reduced carbon footprint
- Optimized routes

## Testing

### Test APIs with cURL

```bash
# Get apartments
curl http://localhost:5000/api/bulk-orders/apartments

# Join bulk order
curl -X POST http://localhost:5000/api/bulk-orders/bulk-orders/join \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "...",
    "apartmentId": "...",
    "orderId": "...",
    "items": [...],
    "totalAmount": 450,
    "shopId": "..."
  }'

# Get current bulk order
curl http://localhost:5000/api/bulk-orders/bulk-orders/current/customerId123

# Admin - Get statistics
curl http://localhost:5000/api/bulk-orders/admin/statistics
```

## Future Enhancements

1. **Machine Learning Route Optimization:** AI-based optimal delivery ordering
2. **Real-time Notifications:** Push notifications for order statuses
3. **Payment Integration:** Wallet deduction for discounts
4. **Rating System:** Customer ratings for bulk orders
5. **Analytics Dashboard:** Detailed customer and order analytics
6. **SMS/WhatsApp Integration:** Order confirmations and updates
7. **Mobile App:** Native mobile app with tracking
8. **Referral Program:** Bonuses for inviting neighbors

---

**Version:** 1.0
**Last Updated:** February 2025
**Status:** Ready for Implementation
