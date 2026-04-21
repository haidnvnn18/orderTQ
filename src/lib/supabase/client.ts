import { createClient } from '@supabase/supabase-js';

// Lưu ý: Các biến môi trường này cần phải có NEXT_PUBLIC_ ở đằng trước để trình duyệt (Client-side) có thể đọc được
// Tuy nhiên vì dự án đang xài "DATABASE_URL" và "DIRECT_URL" cho backend nên ta chưa định nghĩa public API key.
// Do đó chúng ta cần thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Export 1 function thay vì biến hằng số, để tránh lỗi nếu code chạy ở môi trường build không lấy được biến
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
