-- Recreate scouts table with UUID id
DROP TABLE IF EXISTS public.scouts CASCADE;

CREATE TABLE public.scouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    branch TEXT NOT NULL,
    patrol TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scouts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.scouts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.scouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.scouts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.scouts FOR DELETE USING (true);
