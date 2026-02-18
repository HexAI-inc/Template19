# HexAI WiFi Payment Backend

Backend server for integrating the HexAI Payment Gateway with Wave Mobile Money for the LE.SS WiFi Hotspot system in Gambia.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your settings:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# HexAI Payment Gateway API
API_BASE_URL=https://hpg-backend-6kzwb.ondigitalocean.app/api/v1
API_KEY=hexai_pba1qb16rxe

# Webhook Secret (get this from HexAI dashboard)
WEBHOOK_SECRET=your_webhook_secret_here

# CORS Origins (your hotspot IP/domain)
CORS_ORIGINS=http://localhost,http://127.0.0.1,http://192.168.88.1

# Business Configuration
BUSINESS_NAME=LE.SS WiFi
CURRENCY=GMD

# Callback URLs
SUCCESS_URL=http://192.168.88.1/alogin-gambia.html
ERROR_URL=http://192.168.88.1/error-gambia.html
```

### Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on port 3001 (or your configured PORT).

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/status` | API status |
| GET | `/api/packages` | Get available WiFi packages |
| POST | `/api/payment/initiate` | Initiate a payment |
| GET | `/api/payment/status/:ref` | Check payment status |
| POST | `/api/webhook` | Webhook handler for payment notifications |
| GET | `/api/transactions` | Get transaction history |

## 🔧 API Usage

### Initiate Payment

```bash
curl -X POST http://localhost:3001/api/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "25.00",
    "package_type": "24h",
    "package_name": "24 Hours",
    "success_url": "http://192.168.88.1/alogin-gambia.html",
    "error_url": "http://192.168.88.1/error-gambia.html"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "transaction_id": "tx_abc123",
    "redirect_url": "https://checkout.wave.com/...",
    "client_reference": "WIFI-24H-1707307200000-A1B2C3",
    "status": "PENDING"
  }
}
```

### Check Payment Status

```bash
curl http://localhost:3001/api/payment/status/WIFI-24H-1707307200000-A1B2C3
```

### Get Available Packages

```bash
curl http://localhost:3001/api/packages
```

## 🔒 Security

1. **API Key Protection**: The HexAI API key is stored server-side only
2. **CORS Configuration**: Only whitelisted origins can access the API
3. **Webhook Verification**: HMAC-SHA256 signature verification for webhooks

## 📦 WiFi Packages

| Package | Price | Duration |
|---------|-------|----------|
| 1 Hour | D10 | 1 hour |
| 24 Hours | D25 | 24 hours |
| 1 Week | D100 | 7 days |
| 1 Month | D350 | 30 days |

## 🌐 Deployment

### On MikroTik Router

1. Deploy this backend on a server accessible from your network
2. Update the frontend `js/hexai-payment.js` with your backend URL:
```javascript
config: {
    backendUrl: 'http://your-server:3001',
    // ...
}
```

### On DigitalOcean App Platform

1. Create a new App
2. Connect your repository
3. Set environment variables in the App settings
4. Deploy

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name "hexai-wifi-backend"
pm2 save
pm2 startup
```

## 📞 Support

- HexAI Payment Gateway: admin@hexai.gm
- Documentation: https://hpg-frontend-m3vhq.ondigitalocean.app/docs

## 📄 License

MIT
