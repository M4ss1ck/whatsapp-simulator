import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { ExportedChatData, Message, Participant, PhoneStatusBar } from '../types';
import { ChatMode } from './ChatSettings';
import ChatPhone from './ChatPhone';
import { buildExportData } from '../utils/chatSerialization';
import {
  createRemotionRender,
  getRemotionApiBase,
  getRemotionRenderStatus,
  RenderJob
} from '../api/remotion';

interface ChatPreviewProps {
  messages: Message[];
  participants: Participant[];
  mode: ChatMode;
  meId: string | null;
  groupTitle?: string;
  groupAvatar?: string | null;
  phoneStatus: PhoneStatusBar;
  showDateDividers?: boolean;
  customDateFormat?: (date: Date) => string;
  backgroundImage?: string;
  onMessageClick?: (message: Message) => void;
  onStateImport?: (data: ExportedChatData) => void;
}

export default function ChatPreview({
  messages,
  participants,
  mode,
  meId,
  groupTitle = 'Group Chat',
  groupAvatar = null,
  phoneStatus,
  showDateDividers = true,
  customDateFormat,
  backgroundImage,
  onMessageClick,
  onStateImport
}: ChatPreviewProps) {
  const phoneRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [conversationTitle, setConversationTitle] = useState(() => {
    const saved = localStorage.getItem('conversationTitle');
    return saved || 'My WhatsApp Chat';
  });
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);

  const remotionApiBase = getRemotionApiBase();
  const remotionConfigured = Boolean(remotionApiBase);

  const otherParticipant = mode === 'private' && meId
    ? participants.find((participant) => participant.id !== meId)
    : null;

  const chatTitle = mode === 'private' && otherParticipant ? otherParticipant.name : groupTitle;
  const chatAvatar = mode === 'private' && otherParticipant ? otherParticipant.avatar : groupAvatar;

  useEffect(() => {
    localStorage.setItem('conversationTitle', conversationTitle);
  }, [conversationTitle]);

  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = chatAvatar || '/favicon.ico';
    }

    document.title = chatTitle || 'WhatsApp Simulator';
  }, [chatTitle, chatAvatar]);

  useEffect(() => {
    const jobId = renderJob?.id;
    if (!jobId || renderJob?.status === 'done' || renderJob?.status === 'error') return;

    let cancelled = false;

    const poll = async () => {
      try {
        const status = await getRemotionRenderStatus(jobId);
        if (cancelled) return;
        setRenderJob(status);
        if (status.status === 'error' && status.error) {
          setRenderError(status.error);
        }
        if (status.status === 'done' || status.status === 'error') {
          window.clearInterval(interval);
        }
      } catch (error) {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : 'Failed to fetch render status.');
        }
      }
    };

    const interval = window.setInterval(poll, 2000);
    poll();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [renderJob?.id]);

  const exportAsImage = async () => {
    if (!phoneRef.current) return;

    try {
      const dataUrl = await toPng(phoneRef.current);
      const link = document.createElement('a');
      const safeTitle = conversationTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  const handleExportState = () => {
    const exportData = buildExportData({
      participants,
      messages,
      chatSettings: {
        mode,
        title: groupTitle,
        avatar: groupAvatar
      },
      meId,
      phoneStatus,
      showDateDividers,
      chatBackground: backgroundImage || ''
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    const safeTitle = conversationTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const importedData = JSON.parse(readerEvent.target?.result as string) as ExportedChatData;
        if (importedData.conversationTitle) {
          setConversationTitle(importedData.conversationTitle);
        }
        if (onStateImport) {
          onStateImport(importedData);
        }
        if (importFileRef.current) {
          importFileRef.current.value = '';
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check if the file is valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleRenderVideo = async () => {
    setRenderError(null);

    if (!remotionConfigured) {
      setRenderError('Remotion API URL is not configured.');
      return;
    }

    const exportData = buildExportData({
      participants,
      messages,
      chatSettings: {
        mode,
        title: groupTitle,
        avatar: groupAvatar
      },
      meId,
      phoneStatus,
      showDateDividers,
      chatBackground: backgroundImage || ''
    });

    const compositionId = import.meta.env.VITE_REMOTION_COMPOSITION_ID;

    try {
      setRenderLoading(true);
      setRenderJob(null);
      const job = await createRemotionRender({
        compositionId: compositionId || undefined,
        inputProps: exportData
      });
      setRenderJob(job);
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : 'Failed to start render.');
    } finally {
      setRenderLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={conversationTitle}
          onChange={(event) => setConversationTitle(event.target.value)}
          placeholder="Enter conversation title..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#25d366] focus:ring-1 focus:ring-[#25d366] outline-none transition-colors duration-200"
        />
      </div>

      <ChatPhone
        messages={messages}
        participants={participants}
        mode={mode}
        meId={meId}
        groupTitle={groupTitle}
        groupAvatar={groupAvatar}
        phoneStatus={phoneStatus}
        showDateDividers={showDateDividers}
        customDateFormat={customDateFormat}
        backgroundImage={backgroundImage}
        onMessageClick={onMessageClick}
        phoneRef={phoneRef}
      />

      <div className="mt-4 flex flex-col items-center justify-center space-y-2 w-full">
        <button
          onClick={exportAsImage}
          className="w-full max-w-[200px] bg-[#25d366] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00a884] transition-colors duration-200 shadow-sm"
        >
          Export as Image
        </button>

        <button
          onClick={handleExportState}
          className="w-full max-w-[200px] bg-[#25d366] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00a884] transition-colors duration-200 shadow-sm"
        >
          Export Chat Data
        </button>

        <button
          onClick={handleRenderVideo}
          disabled={!remotionConfigured || renderLoading}
          className={`w-full max-w-[200px] px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm ${
            !remotionConfigured || renderLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#128c7e] text-white hover:bg-[#0b6b5f]'
          }`}
        >
          {renderLoading ? 'Starting Render...' : 'Render Video'}
        </button>

        {renderJob && (
          <div className="text-xs text-gray-600 text-center">
            Status: {renderJob.status}
            {typeof renderJob.progress === 'number'
              ? ` (${Math.round(renderJob.progress > 1 ? renderJob.progress : renderJob.progress * 100)}%)`
              : ''}
          </div>
        )}

        {renderJob?.outputUrl && (
          <button
            onClick={async () => {
              if (!renderJob.outputUrl) return;
              try {
                const response = await fetch(renderJob.outputUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const safeTitle = conversationTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                link.download = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.mp4`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
              } catch (error) {
                setRenderError(error instanceof Error ? error.message : 'Failed to download video.');
              }
            }}
            className="text-xs text-[#128c7e] underline"
          >
            Download Video
          </button>
        )}

        {renderError && (
          <div className="text-xs text-red-600 text-center max-w-[240px]">
            {renderError}
          </div>
        )}

        <div className="relative w-full max-w-[200px] bg-[#25d366] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#00a884]">
          <label htmlFor="importFile" className="cursor-pointer">
            Import Chat Data
          </label>
          <input
            ref={importFileRef}
            id="importFile"
            type="file"
            accept=".json"
            onChange={handleImportState}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            placeholder="Import Chat Data"
          />
        </div>
      </div>
    </div>
  );
}
