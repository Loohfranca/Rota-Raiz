create or replace function public.rr_validate_ledger(p jsonb) returns void language plpgsql set search_path='' as $$
declare person jsonb; expense jsonb; shares record; person_ids text[]; sum_shares bigint;
begin
 if p is null or pg_column_size(p)>1048576 or jsonb_typeof(p)<>'object' or jsonb_typeof(p->'name') is distinct from 'string' or length(trim(p->>'name')) not between 1 and 100
 or jsonb_typeof(p->'people') is distinct from 'array' or jsonb_typeof(p->'expenses') is distinct from 'array' then raise exception 'Dados da viagem inválidos.';end if;
 if jsonb_array_length(p->'people') not between 1 and 50 or jsonb_array_length(p->'expenses')>10000 then raise exception 'Limite de participantes ou despesas excedido.';end if;
 select array_agg(value->>'id') into person_ids from jsonb_array_elements(p->'people');
 if cardinality(person_ids)<>(select count(distinct x) from unnest(person_ids) x) then raise exception 'Participantes duplicados.';end if;
 for person in select value from jsonb_array_elements(p->'people') loop
  if jsonb_typeof(person->'id') is distinct from 'string' or length(person->>'id') not between 1 and 100 or jsonb_typeof(person->'name') is distinct from 'string' or length(trim(person->>'name')) not between 1 and 60 then raise exception 'Participante inválido.';end if;
 end loop;
 if jsonb_array_length(p->'expenses')<>(select count(distinct value->>'id') from jsonb_array_elements(p->'expenses')) then raise exception 'Despesas duplicadas.';end if;
 for expense in select value from jsonb_array_elements(p->'expenses') loop
  if jsonb_typeof(expense->'id') is distinct from 'string' or length(expense->>'id') not between 1 and 100
   or jsonb_typeof(expense->'description') is distinct from 'string' or length(trim(expense->>'description')) not between 1 and 160
   or not coalesce(expense->>'category'=any(array['Alimentação','Transporte','Passagem de avião','Hospedagem','Passeios','Compras','Outros']),false)
   or jsonb_typeof(expense->'amount') is distinct from 'number' or not coalesce(expense->>'amount' ~ '^[0-9]+$',false)
   or (expense->>'amount')::numeric not between 1 and 100000000
   or not coalesce((expense->>'payer')=any(person_ids),false)
   or not coalesce(expense->>'date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',false)
   or jsonb_typeof(expense->'shares') is distinct from 'object' then raise exception 'Despesa inválida.';end if;
  if to_char((expense->>'date')::date,'YYYY-MM-DD')<>expense->>'date' then raise exception 'Data inválida.';end if;
  if expense ? 'installments' then
   if jsonb_typeof(expense->'installments') is distinct from 'number'
    or not coalesce(expense->>'installments' ~ '^[0-9]+$',false)
    then raise exception 'Parcelamento inválido.'; end if;
   if (expense->>'installments')::numeric not between 1 and 60
    or (expense->>'installments')::numeric > (expense->>'amount')::numeric
    then raise exception 'Parcelamento inválido.'; end if;
  end if;
  sum_shares:=0;
  if (select count(*) from jsonb_each(expense->'shares'))=0 then raise exception 'Escolha quem participa da divisão.';end if;
  for shares in select key,value from jsonb_each(expense->'shares') loop
   if not shares.key=any(person_ids) or jsonb_typeof(shares.value)<>'number' or not (shares.value::text ~ '^[0-9]+$') or shares.value::text::numeric>100000000 then raise exception 'Divisão inválida.';end if;
   sum_shares:=sum_shares+shares.value::text::bigint;
  end loop;
  if sum_shares<>(expense->>'amount')::bigint then raise exception 'A divisão não corresponde ao valor do gasto.';end if;
 end loop;
end $$;

revoke all on function public.rr_validate_ledger(jsonb) from public, anon, authenticated;
