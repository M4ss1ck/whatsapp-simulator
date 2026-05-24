import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { ExportedChatData, Message, Participant, PhoneStatusBar } from '../types';
import { ChatMode } from './ChatSettings';
import ChatPhone from './ChatPhone';
import { buildExportData } from '../utils/chatSerialization';
import {
  ApiError,
  createRemotionRender,
  getRemotionApiBase,
  getRemotionRenderStatus
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

const ACTIVE_RENDER_JOB_ID_KEY = 'activeRenderJobId';

const getSafeTitle = (title: string) => title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

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
  const [activeJobId, setActiveJobId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_RENDER_JOB_ID_KEY)
  );
  const [renderError, setRenderError] = useState<string | null>(null);

  const remotionApiBase = getRemotionApiBase();
  const remotionConfigured = Boolean(remotionApiBase);

  const otherParticipant = mode === 'private' && meId
    ? participants.find((participant) => participant.id !== meId)
    : null;

  const chatTitle = mode === 'private' && otherParticipant ? otherParticipant.name : groupTitle;
  const chatAvatar = mode === 'private' && otherParticipant ? otherParticipant.avatar : groupAvatar;

  const clearActiveJobId = () => {
    setActiveJobId(null);
    localStorage.removeItem(ACTIVE_RENDER_JOB_ID_KEY);
  };

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

  const renderStatusQuery = useQuery({
    queryKey: ['render', activeJobId],
    queryFn: () => getRemotionRenderStatus(activeJobId!),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'done' || status === 'error') {
        return false;
      }
      return 2000;
    },
    retry: 1
  });

  useEffect(() => {
    if (!renderStatusQuery.error) {
      return;
    }

    if (renderStatusQuery.error instanceof ApiError && renderStatusQuery.error.status === 404) {
      clearActiveJobId();
      setRenderError('Render job was lost after renderer restart. Start a new render.');
      return;
    }

    setRenderError(getErrorMessage(renderStatusQuery.error, 'Failed to fetch render status.'));
  }, [renderStatusQuery.error]);

  const renderMutation = useMutation({
    mutationFn: createRemotionRender,
    onSuccess: (job) => {
      setRenderError(null);
      setActiveJobId(job.id);
      localStorage.setItem(ACTIVE_RENDER_JOB_ID_KEY, job.id);
    },
    onError: (error) => {
      setRenderError(getErrorMessage(error, 'Failed to start render.'));
    }
  });

  const buildRenderRequest = () => {
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

    return {
      compositionId: compositionId || undefined,
      inputProps: exportData
    };
  };

  const startRender = (replaceExisting: boolean) => {
    setRenderError(null);

    if (!remotionConfigured) {
      setRenderError('Remotion API URL is not configured.');
      return;
    }

    if (activeJobId && !replaceExisting) {
      setRenderError('Clear the current job before starting a new render.');
      return;
    }

    if (replaceExisting && activeJobId) {
      clearActiveJobId();
    }

    renderMutation.mutate(buildRenderRequest());
  };

  const exportAsImage = async () => {
    if (!phoneRef.current) return;

    try {
      const dataUrl = await toPng(phoneRef.current);
      const link = document.createElement('a');
      link.download = `${getSafeTitle(conversationTitle)}-${new Date().toISOString().slice(0, 10)}.png`;
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
    link.download = `${getSafeTitle(conversationTitle)}-${new Date().toISOString().slice(0, 10)}.json`;
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

  const handleDownloadVideo = async () => {
    const outputUrl = renderStatusQuery.data?.outputUrl;
    if (!outputUrl) return;

    try {
      const response = await fetch(outputUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${getSafeTitle(conversationTitle)}-${new Date().toISOString().slice(0, 10)}.mp4`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setRenderError(getErrorMessage(error, 'Failed to download video.'));
    }
  };

  const currentStatus = renderStatusQuery.data?.status;
  const hasActiveJob = Boolean(activeJobId);
  const isQueued = currentStatus === 'queued';
  const isRendering = currentStatus === 'rendering';
  const isDone = currentStatus === 'done';
  const isErrored = currentStatus === 'error';
  const statusProgress = typeof renderStatusQuery.data?.progress === 'number'
    ? Math.round(
        renderStatusQuery.data.progress > 1
          ? renderStatusQuery.data.progress
          : renderStatusQuery.data.progress * 100
      )
    : null;

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
          onClick={() => startRender(false)}
          disabled={!remotionConfigured || renderMutation.isPending || hasActiveJob}
          className={`w-full max-w-[200px] px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm ${
            !remotionConfigured || renderMutation.isPending || hasActiveJob
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#128c7e] text-white hover:bg-[#0b6b5f]'
          }`}
        >
          {renderMutation.isPending ? 'Starting Render...' : 'Render Video'}
        </button>

        {hasActiveJob && (
          <>
            <div className="text-xs text-gray-600 text-center">
              Status: {currentStatus || 'checking...'}
              {typeof statusProgress === 'number' ? ` (${statusProgress}%)` : ''}
            </div>

            {isQueued && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-[#128c7e]" />
                <span>Waiting in queue...</span>
              </div>
            )}

            {isRendering && (
              <div className="w-full max-w-[240px]">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-[#128c7e] transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, statusProgress ?? 0))}%` }}
                  />
                </div>
              </div>
            )}

            {isDone && (
              <>
                <div className="text-xs text-green-700 font-medium">
                  Render complete.
                </div>
                <button
                  onClick={handleDownloadVideo}
                  className="text-xs text-[#128c7e] underline"
                >
                  Download Video
                </button>
              </>
            )}

            {isErrored && (
              <button
                onClick={() => startRender(true)}
                disabled={renderMutation.isPending}
                className={`w-full max-w-[200px] px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  renderMutation.isPending
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Try Again
              </button>
            )}

            <button
              onClick={clearActiveJobId}
              className="w-full max-w-[200px] bg-white text-[#128c7e] border border-[#128c7e] px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#e9f7f5] transition-colors duration-200"
            >
              {isQueued || isRendering ? 'Forget this job' : 'Start new render'}
            </button>
          </>
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
