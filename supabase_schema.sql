-- ==============================================================================
-- SCHEMA SUPABASE: ROTA RAIZ (LITORAL SUL DA BAHIA)
-- Grafo de Transporte Regional Raiz (Balsas, Vans, Ônibus, Canoas, Barcos)
-- ==============================================================================

-- 1. Tabela de Cidades / Distritos
CREATE TABLE IF NOT EXISTS public.cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'BA',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Operadores e Associações Locais
CREATE TABLE IF NOT EXISTS public.operators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    type TEXT NOT NULL DEFAULT 'van', -- 'ferry', 'van', 'bus', 'canoe', 'boat', 'walk'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Paradas / Terminais / Nós do Grafo
CREATE TABLE IF NOT EXISTS public.stops (
    id TEXT PRIMARY KEY,
    city_id TEXT REFERENCES public.cities(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL DEFAULT 'van', -- 'ferry', 'van', 'bus', 'canoe', 'boat', 'place'
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Trechos / Arestas do Grafo (Legs)
CREATE TABLE IF NOT EXISTS public.legs (
    id TEXT PRIMARY KEY,
    from_stop_id TEXT NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
    to_stop_id TEXT NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
    operator_id TEXT REFERENCES public.operators(id) ON DELETE SET NULL,
    transport_mode TEXT NOT NULL DEFAULT 'van', -- 'ferry', 'van', 'bus', 'canoe', 'boat', 'walk'
    title TEXT NOT NULL,
    min_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    duration_min INTEGER NOT NULL DEFAULT 15,
    distance_km NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    frequency_desc TEXT,
    first_departure TEXT,
    last_departure TEXT,
    payment_methods JSONB DEFAULT '["Dinheiro vivo"]'::jsonb,
    tide_dependent BOOLEAN DEFAULT false,
    confirmed BOOLEAN DEFAULT false,
    last_verified TIMESTAMPTZ,
    verified_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Atrativos e Passeios (Places)
CREATE TABLE IF NOT EXISTS public.places (
    id TEXT PRIMARY KEY,
    city_id TEXT REFERENCES public.cities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    location TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    category TEXT DEFAULT 'Praias',
    rating NUMERIC(3,2) DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 100,
    temperature TEXT,
    closest_stop_id TEXT REFERENCES public.stops(id) ON DELETE SET NULL,
    entry_fee NUMERIC(10,2) DEFAULT 0.00,
    entry_fee_desc TEXT,
    tide_dependent BOOLEAN DEFAULT false,
    tide_peak TEXT,
    tide_window TEXT,
    last_return_transport TEXT,
    expense_range TEXT,
    image_url TEXT,
    photo_alt TEXT,
    backpack_tips JSONB DEFAULT '[]'::jsonb,
    confirmed BOOLEAN DEFAULT false,
    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de Favoritos / Roteiros Salvos Offline
CREATE TABLE IF NOT EXISTS public.saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL,
    item_type TEXT NOT NULL, -- 'route' ou 'place'
    item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Leitura pública para que qualquer viajante consulte as rotas mesmo sem login
-- Escrita livre para demonstração / restrita por chave de autenticação
-- ==============================================================================
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Leitura pública de cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Leitura pública de operators" ON public.operators FOR SELECT USING (true);
CREATE POLICY "Leitura pública de stops" ON public.stops FOR SELECT USING (true);
CREATE POLICY "Leitura pública de legs" ON public.legs FOR SELECT USING (true);
CREATE POLICY "Leitura pública de places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Leitura pública de saved_items" ON public.saved_items FOR SELECT USING (true);

-- Políticas de Atualização / Inserção
CREATE POLICY "Permite inserção pública de saved_items" ON public.saved_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Permite atualização de confirmação em legs" ON public.legs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permite inserção em legs" ON public.legs FOR INSERT WITH CHECK (true);
CREATE POLICY "Permite atualização em places" ON public.places FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permite inserção em places" ON public.places FOR INSERT WITH CHECK (true);
