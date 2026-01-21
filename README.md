# Thumblify

AI-powered YouTube thumbnail generator that helps creators design eye-catching thumbnails with ease.

## Description

Thumblify revolutionizes the way content creators design YouTube thumbnails by harnessing the power of artificial intelligence. Say goodbye to hours spent in design software and hello to professional, attention-grabbing thumbnails generated in seconds.

Whether you're a beginner YouTuber or an established content creator, Thumblify makes thumbnail creation effortless. Simply describe your vision, choose your quality tier, and let our AI do the heavy lifting. With Pollination AI integration, every thumbnail is crafted to maximize click-through rates and viewer engagement.

Our platform features a fair credit-based system where new users get 30 free credits to explore the service. Create basic thumbnails for just 5 credits or opt for premium quality at 10 credits per generation. Need more credits? Our seamless Razorpay integration makes purchasing additional credits quick and secure.

Security and convenience are at the core of Thumblify. With Google OAuth authentication, you can sign up and start creating in seconds without the hassle of managing yet another password. Focus on what matters most - creating amazing content while we handle your thumbnail needs.

## Overview

Thumblify is an AI-driven platform that generates professional YouTube thumbnails using advanced AI technology. With integrated payment processing and a credit-based system, users can create stunning thumbnails in just a few clicks.

## Features

- **AI-Powered Generation**: Leverages Pollination AI to create high-quality YouTube thumbnails
- **Two Tier System**: 
  - **Basic Thumbnails** - 5 credits per generation
  - **Premium Thumbnails** - 10 credits per generation
- **Free Credits**: Every new user receives 30 free credits to get started
- **Razorpay Integration**: Seamless payment processing for credit purchases
- **Google OAuth**: Secure authentication using Google accounts
- **Credit Management**: Track and manage your thumbnail generation credits

## Tech Stack

- **Frontend**: React/Next.js (Client folder)
- **Backend**: Node.js (Server folder)
- **AI Integration**: Pollination AI
- **Payment Gateway**: Razorpay
- **Authentication**: Google OAuth

## Project Structure

```
thumblify/
├── client/          # Frontend application
└── server/          # Backend application
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google OAuth credentials
- Razorpay API keys
- Pollination AI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/thumblify.git
cd thumblify
```

2. Install dependencies for both client and server

**Client:**
```bash
cd client
npm install
```

**Server:**
```bash
cd server
npm install
```

3. Set up environment variables

Create `.env` files in both client and server directories with the necessary credentials:

**Client `.env`:**
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_API_URL=http://localhost:5000
```

**Server `.env`:**
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
POLLINATION_API_KEY=your_pollination_api_key
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Running the Application

**Start the Client (Development Mode):**
```bash
cd client
npm run dev
```

**Start the Server:**
```bash
cd server
npm start
```

The client will typically run on `http://localhost:3000` and the server on `http://localhost:5000`.

## How It Works

1. **Sign Up**: New users sign up using Google OAuth and receive 30 free credits
2. **Choose Tier**: Select between Basic (5 credits) or Premium (10 credits) thumbnail generation
3. **Generate**: AI creates your custom YouTube thumbnail
4. **Purchase Credits**: Buy more credits via Razorpay when you run low

## Credit System

- New users: **30 free credits**
- Basic thumbnail: **5 credits**
- Premium thumbnail: **10 credits**

## Screenshots

### Homepage
![Homepage](path/to/home.png)
*Create stunning thumbnails that get clicks - instantly with AI*

### Thumbnail Generator
![Thumbnail Generator](path/to/generator.png)
*Intuitive interface to create your custom thumbnails with various styles and color schemes*

### Payment Integration
![Razorpay Payment](path/to/payment.png)
*Secure payment processing with multiple payment options via Razorpay*

### Generated Thumbnails Gallery
![My Generated Thumbnails](path/to/ai_generatorimage.png)
*View and manage all your previously generated thumbnails*

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@thumblify.com or open an issue in the repository.

## Acknowledgments

- Pollination AI for thumbnail generation
- Razorpay for payment processing
- Google OAuth for authentication
