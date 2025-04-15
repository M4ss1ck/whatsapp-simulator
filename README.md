# WhatsApp Simulator

Create realistic WhatsApp chat screenshots with this simulator. Perfect for mockups, examples, or tutorials.

## Features

- **Customizable Chat Interface**: Create both private and group chats with realistic WhatsApp UI
- **Participant Management**: Add, edit, and remove chat participants with custom avatars and names
- **Message Styling**: Accurate message bubbles with tails, timestamps, and sequential grouping
- **Date Separators**: Automatic or custom date dividers between messages
- **Phone Status Settings**: Customize battery level and time display
- **Background Options**: Use the default WhatsApp pattern or upload your own background
- **Export as Image**: Save your chat mockup as a PNG image with a single click
- **Dark/Light Theme Support**: Matches your system preferences
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/M4ss1ck/whatsapp-simulator.git

# Navigate to the project directory
cd whatsapp-simulator

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Usage

1. **Manage Participants**: Add participants with names and optional avatars
2. **Create Messages**: Compose messages from different participants
3. **Customize Appearance**: Adjust the phone status bar, background, and other settings
4. **Preview**: See changes instantly in the live preview
5. **Export**: Click the "Export as Image" button to save your mockup

## Components

### Chat Preview

The main display component that renders a replica of a WhatsApp conversation interface with:

- Phone status bar (time, battery)
- WhatsApp header with profile picture and name
- Message bubbles with proper styling based on sender
- Input area with microphone and attachment buttons

### Participant Manager

Add and manage chat participants with:

- Name input
- Avatar upload
- Role selection (you or other participant)

### Chat Settings

Configure chat appearance with options for:

- Chat mode (private or group)
- Group title and avatar (for group chats)
- Background image customization
- Date display format

### Phone Status Settings

Adjust the phone interface elements:

- Custom time display
- Battery level

## Development

Built with:

- React + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Hero Icons for UI elements
- html-to-image for screenshot export functionality

## License

[MIT License](LICENSE)
