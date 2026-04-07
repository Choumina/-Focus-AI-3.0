import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.");
}

// 避免因為缺少 URL 導致 createClient 直接拋出錯誤而造成白屏
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

export const supabase = createClient(supabaseUrl || defaultUrl, supabaseAnonKey || defaultKey);

export enum OperationType {
  CREATE = 'create',

  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error?.message || String(error),
    operationType,
    path
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check database connection
async function testConnection() {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        console.error("Database connection error: ", error.message);
      }
    }
  } catch (err) {
    console.error("Connection test failed", err);
  }
}

testConnection();
