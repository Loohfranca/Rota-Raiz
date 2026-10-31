begin;
-- Bounding-box index bounds candidate rows before computing spherical distance.
create index rr_places_nearby_idx on public.rr_places(lat,lng) where deleted_at is null and lat is not null and lng is not null;
create function public.rr_nearby_places(p_lat double precision,p_lng double precision)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre com sua conta.' using errcode='42501'; end if;
 if p_lat is null or p_lng is null or not(p_lat between -90 and 90) or not(p_lng between -180 and 180) then
  raise exception 'Coordenadas inválidas';
 end if;
 return (select coalesce(jsonb_agg(to_jsonb(r) order by r.distance_m,r.id),'[]'::jsonb) from (
  select p.id,p.name,p.category,p.city as municipality,p.state,p.address,
   6371000*2*asin(sqrt(least(1.0,power(sin(radians(p.lat-p_lat)/2),2)+cos(radians(p_lat))*cos(radians(p.lat))*power(sin(radians(p.lng-p_lng)/2),2)))) as distance_m
  from public.rr_places p where p.deleted_at is null and p.lat between p_lat-0.018 and p_lat+0.018
   and (abs(p_lat)>89 or abs(p.lng-p_lng)<=least(180.0,0.018/greatest(0.00001,cos(radians(p_lat)))) or 360-abs(p.lng-p_lng)<=least(180.0,0.018/greatest(0.00001,cos(radians(p_lat)))))
  order by distance_m,p.id limit 8
 ) r where r.distance_m<=1500);
end $$;
revoke all on function public.rr_nearby_places(double precision,double precision) from public,anon;
grant execute on function public.rr_nearby_places(double precision,double precision) to authenticated;
commit;
