-- Recoverable deletion; existing owner-only RLS and version trigger also apply.
alter table public.travel_itineraries add column if not exists deleted_at timestamptz;
notify pgrst,'reload schema';
