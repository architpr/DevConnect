-- Research Collaboration Hub schema update

-- 1) Research profile (one row per user)
create table if not exists public.research_profile (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    research_interests text[] default '{}',
    research_experience_level text default 'beginner',
    research_tools text[] default '{}',
    research_availability text default 'part-time',
    google_scholar text,
    orcid text,
    researchgate text,
    arxiv text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.research_profile enable row level security;

create policy "Users can view all research profiles."
    on public.research_profile for select
    using (true);

create policy "Users can insert own research profile."
    on public.research_profile for insert
    with check (auth.uid() = user_id);

create policy "Users can update own research profile."
    on public.research_profile for update
    using (auth.uid() = user_id);

-- 2) Research publications history
create table if not exists public.research_publications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    journal_or_conference text not null,
    year int not null,
    doi_link text,
    github_repo text,
    role text not null default 'author', -- author / co-author
    created_at timestamptz default now()
);

create index if not exists idx_research_publications_user_id on public.research_publications(user_id);
create index if not exists idx_research_publications_year on public.research_publications(year desc);

alter table public.research_publications enable row level security;

create policy "Users can view all publications."
    on public.research_publications for select
    using (true);

create policy "Users can insert own publications."
    on public.research_publications for insert
    with check (auth.uid() = user_id);

create policy "Users can update own publications."
    on public.research_publications for update
    using (auth.uid() = user_id);

create policy "Users can delete own publications."
    on public.research_publications for delete
    using (auth.uid() = user_id);

-- 3) Research collaboration posts
create table if not exists public.research_posts (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text not null,
    research_domain text not null,
    required_skills text[] default '{}',
    paper_type text not null check (paper_type in ('survey', 'experimental', 'theoretical')),
    publication_target text,
    required_tools text[] default '{}',
    publication_experience_required boolean default false,
    team_size int not null default 3,
    created_by uuid not null references public.profiles(id) on delete cascade,
    deadline timestamptz,
    status text not null default 'open' check (status in ('open', 'closed')),
    created_at timestamptz default now()
);

create index if not exists idx_research_posts_created_by on public.research_posts(created_by);
create index if not exists idx_research_posts_domain on public.research_posts(research_domain);
create index if not exists idx_research_posts_status_created_at on public.research_posts(status, created_at desc);

alter table public.research_posts enable row level security;

create policy "Research posts are viewable by everyone."
    on public.research_posts for select
    using (true);

create policy "Authenticated users can create research posts."
    on public.research_posts for insert
    with check (auth.role() = 'authenticated' and auth.uid() = created_by);

create policy "Research leads can update own posts."
    on public.research_posts for update
    using (auth.uid() = created_by);

create policy "Research leads can delete own posts."
    on public.research_posts for delete
    using (auth.uid() = created_by);

-- 4) Research applications
create table if not exists public.research_applications (
    id uuid default gen_random_uuid() primary key,
    research_post_id uuid not null references public.research_posts(id) on delete cascade,
    applicant_id uuid not null references public.profiles(id) on delete cascade,
    motivation text not null,
    research_experience text,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
    created_at timestamptz default now(),
    unique (research_post_id, applicant_id)
);

create index if not exists idx_research_applications_post_id on public.research_applications(research_post_id);
create index if not exists idx_research_applications_applicant_id on public.research_applications(applicant_id);

alter table public.research_applications enable row level security;

create policy "Applicants can view own research applications."
    on public.research_applications for select
    using (auth.uid() = applicant_id);

create policy "Research leads can view applications on own posts."
    on public.research_applications for select
    using (
        exists (
            select 1 from public.research_posts rp
            where rp.id = research_applications.research_post_id
              and rp.created_by = auth.uid()
        )
    );

create policy "Authenticated users can apply to research posts."
    on public.research_applications for insert
    with check (auth.role() = 'authenticated' and auth.uid() = applicant_id);

create policy "Research leads can update applications on own posts."
    on public.research_applications for update
    using (
        exists (
            select 1 from public.research_posts rp
            where rp.id = research_applications.research_post_id
              and rp.created_by = auth.uid()
        )
    );

-- Optional trigger for updated_at on research_profile
create or replace function public.set_updated_at_research_profile()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_research_profile_updated_at on public.research_profile;
create trigger trg_research_profile_updated_at
before update on public.research_profile
for each row
execute function public.set_updated_at_research_profile();
