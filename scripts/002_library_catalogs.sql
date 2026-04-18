-- Catalogs: hierarchical structure per user
CREATE TABLE IF NOT EXISTS public.catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogs_select_own" ON public.catalogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "catalogs_insert_own" ON public.catalogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "catalogs_update_own" ON public.catalogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "catalogs_delete_own" ON public.catalogs FOR DELETE USING (auth.uid() = user_id);

-- Links inside catalogs
CREATE TABLE IF NOT EXISTS public.catalog_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.catalog_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_links_select_own" ON public.catalog_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "catalog_links_insert_own" ON public.catalog_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "catalog_links_update_own" ON public.catalog_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "catalog_links_delete_own" ON public.catalog_links FOR DELETE USING (auth.uid() = user_id);
