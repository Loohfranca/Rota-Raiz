create index if not exists shared_trips_owner_idx on public.shared_trips(owner_id);
create index if not exists trip_invitations_creator_idx on public.trip_invitations(created_by);
create index if not exists trip_invitations_used_by_idx on public.trip_invitations(used_by);
