<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VOGUE AI - Virtual Stylist & Runway

An advanced AI-powered virtual try-on application that generates professional fashion lookbooks with multiple poses using state-of-the-art AI models.

## ✨ Features

- **Multi-Model Support**: Choose between Gemini 3, SeeDream V4.5, and Flux 2 Pro for image generation
- **4-Pose Lookbook**: Generate professional fashion photography with 4 different poses in one click
- **Custom Wardrobe**: Upload and manage your own clothing items
- **Video Generation**: Create runway videos using Veo 3.1
- **Secure API Management**: Store API keys locally or in config files
- **Image Validation**: Automatic validation of file format and size
- **Responsive Design**: Beautiful, magazine-style interface optimized for all devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- pnpm, npm, or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd vogue
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. **Configure API Keys**

   You have two options:

   **Option A: Using config.json (Recommended for local development)**
   \`\`\`bash
   cp config.example.json config.json
   \`\`\`
   Then edit \`config.json\` with your API keys:
   \`\`\`json
   {
     "gemini_api_key": "YOUR_GEMINI_API_KEY",
     "wavespeed_api_key": "YOUR_WAVESPEED_API_KEY"
   }
   \`\`\`

   **Option B: Using the UI**
   - Run the app and click "Configure API Key" in the header
   - Enter your API keys in the modal

   **Where to get API keys:**
   - Gemini API: https://aistudio.google.com/app/apikey
   - Wavespeed API (for SeeDream & Flux): https://wavespeed.ai

4. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Navigate to \`http://localhost:3000\`

## 📋 Usage

1. **Upload a person image** in the "The Muse" section
2. **Select clothing items** from the wardrobe or upload your own
3. **Choose an AI model** (Gemini, SeeDream, or Flux)
4. **Click "Generate Lookbook"** to create 4 professional photos
5. **Optional:** Generate a runway video from your favorite look

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via inline classes)
- **AI Models**:
  - Google Gemini 3 Pro Image
  - ByteDance SeeDream V4.5
  - Flux 2 Pro
  - Veo 3.1 Fast (for video generation)

## 🔒 Security

- API keys are stored securely in localStorage
- \`config.json\` is gitignored to prevent accidental commits
- No API keys are sent to any third-party services except the AI providers

## 🎨 Project Structure

\`\`\`
vogue/
├── components/
│   └── UploadZone.tsx      # Image upload component
├── services/
│   ├── geminiService.ts    # Gemini API integration
│   ├── seedreamService.ts  # SeeDream & Flux API integration
│   └── configService.ts    # API key management
├── public/
│   └── clothes/            # Sample clothing images
├── App.tsx                 # Main application component
├── types.ts                # TypeScript type definitions
├── utils.ts                # Utility functions
└── config.example.json     # Example configuration file
\`\`\`

## 🔧 Configuration

### API Keys in config.json

The recommended way to configure API keys is through \`config.json\`:

1. Copy \`config.example.json\` to \`config.json\`
2. Add your API keys
3. The file is gitignored for security

### Image Validation

- **Supported formats**: JPEG, PNG, WebP
- **Maximum file size**: 10MB

## 🐛 Troubleshooting

**Images not generating?**
- Check that your API key is correctly configured
- Ensure you have sufficient credits with your AI provider
- Check the browser console for error messages

**Slow generation?**
- Flux 2 Pro can take 2-3 minutes per image (high quality)
- SeeDream typically takes 1-2 minutes per image
- Gemini is usually the fastest option

**Upload errors?**
- Ensure your image is in JPEG, PNG, or WebP format
- Check that the file size is under 10MB
- Try converting the image to a different format

## 📝 Recent Improvements

This version includes several critical improvements:

✅ **Security**
- Added \`config.json\` to \`.gitignore\` to prevent API key exposure
- Fixed direct usage of \`process.env.API_KEY\` in video generation

✅ **Code Quality**
- Fixed mutation of \`SAMPLE_CLOTHES\` constant by using React state
- Optimized \`UploadZone\` component with \`React.memo\`
- Added comprehensive error handling in all services

✅ **Validation**
- Added image format validation (JPEG, PNG, WebP only)
- Added file size validation (10MB limit)
- Improved error messages with specific details

✅ **Reliability**
- Implemented global timeout for API polling (5 minutes)
- Added retry logic for transient network errors
- Better error recovery in polling functions

✅ **Accessibility**
- Added ARIA labels to interactive elements
- Implemented proper button states (\`aria-pressed\`)
- Added descriptive labels for screen readers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- AI Studio App: https://ai.studio/apps/drive/1yCD4foKWXEA7aKaepkP4enyvun2NEqtz
- Gemini API: https://ai.google.dev
- Wavespeed AI: https://wavespeed.ai

---

Made with ❤️ using Gemini, SeeDream, and Flux AI models
