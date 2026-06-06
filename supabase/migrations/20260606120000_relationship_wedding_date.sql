-- Wedding date for spouse/partner relationship edges (ISO YYYY-MM-DD or YYYY-MM).
alter table public.relationships
  add column if not exists wedding_date text;

comment on column public.relationships.wedding_date is
  'Optional wedding or partnership date for spouse/partner edges (ISO date).';
