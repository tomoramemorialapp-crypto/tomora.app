-- Gender-specific relationship labels (father/mother, son-in-law, etc.)
alter table public.relationships
  add column if not exists relationship_detail text;

comment on column public.relationships.relationship_detail is
  'Optional gender-specific kinship label for the stored relationship_type (e.g. father_in_law, son_in_law).';
