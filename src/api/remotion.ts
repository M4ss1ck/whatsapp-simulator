export type RenderStatus = 'queued' | 'rendering' | 'done' | 'error';

export interface RenderJob {
  id: string;
  status: RenderStatus;
  progress?: number;
  outputUrl?: string;
  error?: string;
}

export interface RenderRequest {
  compositionId?: string;
  inputProps: unknown;
}

export const getRemotionApiBase = () => {
  const base = import.meta.env.VITE_REMOTION_API_URL;
  return base ? base.replace(/\/$/, '') : '';
};

const parseError = async (response: Response) => {
  try {
    const data = await response.json();
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch (error) {
    // ignore JSON parsing errors
  }
  return response.statusText || 'Unknown error';
};

export const createRemotionRender = async (request: RenderRequest): Promise<RenderJob> => {
  const base = getRemotionApiBase();
  if (!base) {
    throw new Error('VITE_REMOTION_API_URL is not set.');
  }

  const response = await fetch(`${base}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return response.json();
};

export const getRemotionRenderStatus = async (id: string): Promise<RenderJob> => {
  const base = getRemotionApiBase();
  if (!base) {
    throw new Error('VITE_REMOTION_API_URL is not set.');
  }

  const response = await fetch(`${base}/render/${id}`);

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return response.json();
};
