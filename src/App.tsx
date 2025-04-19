import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ChatInput from './components/ChatInput'
import ChatPreview from './components/ChatPreview'
import ParticipantManager from './components/ParticipantManager'
import ChatSettings, { ChatMode } from './components/ChatSettings'
import PhoneStatusSettings from './components/PhoneStatusSettings'
import DateSettings from './components/DateSettings'
import BackgroundSettings from './components/BackgroundSettings'
import { Message, Participant, WhatsAppState, PhoneStatusBar } from './types'
import './App.css'

// Create a link element for the favicon
const createFaviconLink = () => {
  const link = document.getElementById('favicon') as HTMLLinkElement || document.createElement('link');
  link.id = 'favicon';
  link.rel = 'icon';
  link.href = '/favicon.ico';
  document.head.appendChild(link);
  return link;
};

function App() {
  // Initialize favicon when component mounts
  useEffect(() => {
    createFaviconLink();
  }, []);

  // Initialize preview position from localStorage or default to left
  const [previewOnRight, setPreviewOnRight] = useState(() => {
    const saved = localStorage.getItem('previewOnRight');
    return saved ? JSON.parse(saved) : false;
  });

  // Save previewOnRight preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('previewOnRight', JSON.stringify(previewOnRight));
  }, [previewOnRight]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = savedTheme !== null ? JSON.parse(savedTheme) : true;
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    localStorage.setItem('darkMode', JSON.stringify(!isDark));
  };

  const [state, setState] = useState<WhatsAppState>({
    participants: [],
    messages: [],
    chatSettings: {
      mode: 'group',
      title: 'Group Chat',
      avatar: null
    },
    meId: null,
    phoneStatus: {
      batteryLevel: 100,
      customTime: null
    }
  })

  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [showDateDividers, setShowDateDividers] = useState(true)
  const [customDateText, setCustomDateText] = useState('')
  const [chatBackground, setChatBackground] = useState('')

  const handleAddParticipant = (newParticipant: Omit<Participant, 'id'>) => {
    const participant = {
      ...newParticipant,
      id: uuidv4()
    }

    setState(prev => ({
      ...prev,
      participants: [...prev.participants, participant]
    }))

    // Auto-select the new participant if none is selected
    if (!selectedParticipant) {
      setSelectedParticipant(participant)
    }
  }

  const handleRemoveParticipant = (id: string) => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id)
    }))

    // If the selected participant is removed, clear the selection
    if (selectedParticipant?.id === id) {
      setSelectedParticipant(null)
    }

    // If "me" is removed, clear meId
    if (state.meId === id) {
      setState(prev => ({
        ...prev,
        meId: null
      }))
    }
  }

  const handleUpdateParticipant = (updatedParticipant: Participant) => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === updatedParticipant.id ? updatedParticipant : p
      )
    }))

    // Update selected participant if it's the one being updated
    if (selectedParticipant?.id === updatedParticipant.id) {
      setSelectedParticipant(updatedParticipant)
    }
  }

  const handleParticipantChange = (participant: Participant) => {
    setSelectedParticipant(participant)
  }

  const handleSetAsMe = (id: string) => {
    setState(prev => ({
      ...prev,
      meId: id
    }))

    // Auto-switch to private chat if we now have exactly 2 participants
    if (state.participants.length === 2 && state.chatSettings.mode !== 'private') {
      handleChatModeChange('private')
    }
  }

  const handleMessageSend = (messageData: Omit<Message, 'id'>) => {
    const message = {
      ...messageData,
      id: uuidv4()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }))
  }

  // Add a system date message
  const handleAddDateMessage = () => {
    if (!customDateText.trim()) return;

    const dateMessage: Message = {
      id: uuidv4(),
      senderId: 'system_date',
      text: customDateText,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, dateMessage]
    }));

    setCustomDateText('');
  };

  const handleChatModeChange = (mode: ChatMode) => {
    setState(prev => ({
      ...prev,
      chatSettings: {
        ...prev.chatSettings,
        mode
      }
    }))
  }

  const handleChatTitleChange = (title: string) => {
    setState(prev => ({
      ...prev,
      chatSettings: {
        ...prev.chatSettings,
        title
      }
    }))
  }

  const handleChatAvatarChange = (avatar: string | null) => {
    setState(prev => ({
      ...prev,
      chatSettings: {
        ...prev.chatSettings,
        avatar
      }
    }))
  }

  const handlePhoneStatusChange = (phoneStatus: PhoneStatusBar) => {
    setState(prev => ({
      ...prev,
      phoneStatus
    }))
  }

  // Toggle preview position
  const togglePreviewPosition = () => {
    setPreviewOnRight((prev: boolean) => !prev);
  };

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <div className="sticky top-0 py-4 z-20 flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center mx-auto">WhatsApp Conversation Simulator</h1>
        <button
          onClick={toggleTheme}
          className="absolute right-4 p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
          title="Toggle light/dark theme"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sun-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 moon-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start relative">
        {/* Preview - conditionally ordered based on previewOnRight */}
        <div className={`w-full lg:w-1/2 ${previewOnRight ? 'lg:pl-4 order-2' : 'lg:pr-4 order-2 lg:order-1'} flex justify-center lg:sticky lg:top-24`}>
          <ChatPreview
            messages={state.messages}
            participants={state.participants}
            mode={state.chatSettings.mode}
            meId={state.meId}
            groupTitle={state.chatSettings.title}
            groupAvatar={state.chatSettings.avatar}
            phoneStatus={state.phoneStatus}
            showDateDividers={showDateDividers}
            backgroundImage={chatBackground}
          />
        </div>

        {/* Toggle button in divider */}
        <div className="hidden lg:block">
          <button
            onClick={togglePreviewPosition}
            className="preview-switch-button"
            title={previewOnRight ? "Move preview to left" : "Move preview to right"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              {previewOnRight ? (
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>

        {/* Input Controls - conditionally ordered based on previewOnRight */}
        <div className={`w-full lg:w-1/2 ${previewOnRight ? 'lg:pr-4 order-1 lg:order-1' : 'lg:pl-4 order-1 lg:order-2'} space-y-6 mb-8`}>
          <ParticipantManager
            participants={state.participants}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onSetAsMe={handleSetAsMe}
            meId={state.meId}
          />

          <ChatSettings
            mode={state.chatSettings.mode}
            onModeChange={handleChatModeChange}
            participants={state.participants}
            meId={state.meId}
            title={state.chatSettings.title}
            onTitleChange={handleChatTitleChange}
            avatar={state.chatSettings.avatar}
            onAvatarChange={handleChatAvatarChange}
          />

          <PhoneStatusSettings
            batteryLevel={state.phoneStatus.batteryLevel}
            customTime={state.phoneStatus.customTime}
            onStatusChange={handlePhoneStatusChange}
          />

          <DateSettings
            showDateDividers={showDateDividers}
            onShowDateDividersChange={setShowDateDividers}
            customDateText={customDateText}
            onCustomDateTextChange={setCustomDateText}
            onAddDateMessage={handleAddDateMessage}
          />

          <BackgroundSettings
            backgroundImage={chatBackground}
            onBackgroundImageChange={setChatBackground}
          />

          <ChatInput
            participants={state.participants}
            selectedParticipant={selectedParticipant}
            onParticipantChange={handleParticipantChange}
            onMessageSend={handleMessageSend}
          />
        </div>
      </div>
    </div>
  )
}

export default App
