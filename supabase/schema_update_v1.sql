-- Create linked_accounts table
create table public.linked_accounts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    platform text not null, -- 'github', 'leetcode', 'geeksforgeeks'
    platform_username text not null,
    platform_data jsonb default '{}', -- Store stats here
    access_token text, -- Optional, for OAuth
    last_synced_at timestamptz default now(),
    created_at timestamptz default now(),
    unique(user_id, platform)
);

-- Enable RLS
alter table public.linked_accounts enable row level security;

create policy "Users can view their own linked accounts."
    on public.linked_accounts for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own linked accounts."
    on public.linked_accounts for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own linked accounts."
    on public.linked_accounts for update
    using ( auth.uid() = user_id );

create policy "Users can delete their own linked accounts."
    on public.linked_accounts for delete
    using ( auth.uid() = user_id );
