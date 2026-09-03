ALTER TABLE public.periods
  ALTER COLUMN nominal DROP NOT NULL;

ALTER TABLE public.categories
  ALTER COLUMN rec_amount DROP NOT NULL;
