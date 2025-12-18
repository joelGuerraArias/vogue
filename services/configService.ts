// Configuration service to load API keys from config.json file

interface Config {
  gemini_api_key: string;
  wavespeed_api_key: string;
}

let cachedConfig: Config | null = null;

/**
 * Load configuration from config.json file
 */
export const loadConfig = async (): Promise<Config> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Config file not found');
    }
    cachedConfig = await response.json();
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load config.json:', error);
    // Return empty config if file doesn't exist
    return {
      gemini_api_key: '',
      wavespeed_api_key: ''
    };
  }
};

/**
 * Get Gemini API Key from config
 * Priority: localStorage > config.json > environment
 */
export const getGeminiApiKey = async (): Promise<string> => {
  // First try localStorage (persists between sessions, priority for user-entered keys)
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey && storedKey.trim()) {
    return storedKey.trim();
  }
  
  // Then try config file (for initial setup)
  const config = await loadConfig();
  if (config.gemini_api_key && config.gemini_api_key.trim()) {
    // Save to localStorage for persistence
    localStorage.setItem('gemini_api_key', config.gemini_api_key.trim());
    return config.gemini_api_key.trim();
  }
  
  // Fallback to environment variable
  const envKey = process.env.API_KEY;
  if (envKey) return envKey;
  
  throw new Error("Gemini API Key not found. Please add it via the UI or in config.json.");
};

/**
 * Get Wavespeed API Key from config
 * Priority: localStorage > config.json
 */
export const getWavespeedApiKey = async (): Promise<string> => {
  // First try localStorage (persists between sessions, priority for user-entered keys)
  const storedKey = localStorage.getItem('wavespeed_api_key');
  if (storedKey && storedKey.trim()) {
    return storedKey.trim();
  }
  
  // Then try config file (for initial setup)
  const config = await loadConfig();
  if (config.wavespeed_api_key && config.wavespeed_api_key.trim()) {
    // Save to localStorage for persistence
    localStorage.setItem('wavespeed_api_key', config.wavespeed_api_key.trim());
    return config.wavespeed_api_key.trim();
  }
  
  throw new Error("Wavespeed API Key not found. Please add it via the UI or in config.json.");
};

/**
 * Check if Gemini API Key exists
 */
export const hasGeminiApiKey = async (): Promise<boolean> => {
  try {
    const key = await getGeminiApiKey();
    return !!key;
  } catch {
    return false;
  }
};

/**
 * Check if Wavespeed API Key exists
 */
export const hasWavespeedApiKey = async (): Promise<boolean> => {
  try {
    const key = await getWavespeedApiKey();
    return !!key;
  } catch {
    return false;
  }
};

/**
 * Save API key to localStorage (for UI input)
 */
export const saveApiKeyToLocalStorage = (key: 'gemini' | 'wavespeed', value: string) => {
  if (key === 'gemini') {
    localStorage.setItem('gemini_api_key', value);
  } else {
    localStorage.setItem('wavespeed_api_key', value);
  }
  // Clear cache so it reloads
  cachedConfig = null;
};

/**
 * Clear API key from localStorage
 */
export const clearApiKeyFromLocalStorage = (key: 'gemini' | 'wavespeed') => {
  if (key === 'gemini') {
    localStorage.removeItem('gemini_api_key');
  } else {
    localStorage.removeItem('wavespeed_api_key');
  }
  // Clear cache so it reloads
  cachedConfig = null;
};
