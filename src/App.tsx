import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ChatInput from './components/ChatInput'
import ChatPreview from './components/ChatPreview'
import ParticipantManager from './components/ParticipantManager'
import ChatSettings, { ChatMode } from './components/ChatSettings'
import PhoneStatusSettings from './components/PhoneStatusSettings'
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
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8 text-center sticky top-0 bg-[#111b21] py-4 z-20">WhatsApp Conversation Simulator</h1>

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
          />
        </div>

        {/* Toggle button in divider */}
        <div className="hidden lg:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-8">
          <button
            onClick={togglePreviewPosition}
            className="bg-[#00a884] text-white p-2 h-12 w-12 aspect-square rounded-full shadow-lg hover:bg-[#008069] transition-colors flex items-center justify-center"
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
