-- 使用者主表
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  points integer default 0,
  has_completed_onboarding boolean default false,
  has_completed_tour boolean default false,
  home_config jsonb default '["focus", "calendar", "games"]'::jsonb,
  placed_items jsonb default '[]'::jsonb,
  tasks jsonb default '[]'::jsonb,
  user_profile jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 啟用 Row Level Security (RLS)
alter table public.users enable row level security;

-- 建立 RLS 政策 (Policies)
-- 1. 允許使用者讀取自己的資料
create policy "Users can view their own data" 
  on public.users 
  for select 
  using ( auth.uid() = id );

-- 2. 允許使用者新增自己的資料
create policy "Users can insert their own data" 
  on public.users 
  for insert 
  with check ( auth.uid() = id );

-- 3. 允許使用者更新自己的資料
create policy "Users can update their own data" 
  on public.users 
  for update 
  using ( auth.uid() = id );

-- 4. 允許使用者刪除自己的資料
create policy "Users can delete their own data" 
  on public.users 
  for delete 
  using ( auth.uid() = id );

-- 建立 Function 與 Trigger 以在使用者註冊時自動新增至 users 表
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
