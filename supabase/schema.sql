-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  resume_url text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Create posts table (Team Leader Posts)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  skills_required text[] default '{}',
  hackathon_name text,
  created_at timestamptz default now()
);

-- Enable RLS for posts
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone."
  on public.posts for select
  using ( true );

create policy "Authenticated users can create posts."
  on public.posts for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update own posts."
  on public.posts for update
  using ( auth.uid() = user_id );

-- Create applications table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) not null,
  candidate_id uuid references public.profiles(id) not null,
  message text,
  status text default 'pending', -- pending, accepted, rejected
  created_at timestamptz default now(),
  unique(post_id, candidate_id)
);

-- Enable RLS for applications
alter table public.applications enable row level security;

create policy "Users can view their own applications."
  on public.applications for select
  using ( auth.uid() = candidate_id );

create policy "Post owners can view applications for their posts."
  on public.applications for select
  using ( exists (
    select 1 from public.posts
    where posts.id = applications.post_id
    and posts.user_id = auth.uid()
  ));

create policy "Authenticated users can apply."
  on public.applications for insert
  with check ( auth.uid() = candidate_id );

-- Create platforms table
create table public.platforms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text,
  date timestamptz,
  description text,
  created_at timestamptz default now()
);

-- Enable RLS for platforms
alter table public.platforms enable row level security;

create policy "Platforms are viewable by everyone."
  on public.platforms for select
  using ( true );

-- Storage Bucket Setup (You might need to create the bucket 'resumes' manually in dashboard if SQL fails for storage)
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true)
on conflict (id) do nothing;

create policy "Resume objects are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'resumes' );

create policy "Authenticated users can upload resumes."
  on storage.objects for insert
  with check ( bucket_id = 'resumes' and auth.role() = 'authenticated' );
