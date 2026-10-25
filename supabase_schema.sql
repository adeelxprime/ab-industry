-- ====================================================================
-- AB INDUSTRY — SUPABASE DATABASE SCHEMA & INITIAL SETUP
-- Copy and run this in your Supabase Project -> SQL Editor -> Click 'Run'
-- ====================================================================

-- 1. Create Products Table (if not exists)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    n TEXT NOT NULL,
    pr TEXT NOT NULL,
    price_num NUMERIC DEFAULT 0,
    sizes TEXT DEFAULT 'S, M, L, XL, XXL',
    cat TEXT NOT NULL DEFAULT 'new',
    cat_name TEXT DEFAULT 'MEN’S COLLECTION',
    b TEXT DEFAULT '',
    c TEXT DEFAULT 'b-new',
    img TEXT NOT NULL,
    back TEXT,
    imgs JSONB DEFAULT '[]'::jsonb,
    video TEXT DEFAULT '',
    in_scroll BOOLEAN DEFAULT true,
    top_position BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 1,
    fabric TEXT DEFAULT 'Cotton Fleece',
    pieces TEXT DEFAULT 'Set',
    stock TEXT DEFAULT 'In Stock',
    d TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely ensure all newer columns exist if table was created previously
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT DEFAULT 'S, M, L, XL, XXL';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS imgs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_scroll BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS top_position BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;

-- 2. Create Store Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allow Public Read, Allow Full Access with Anon Key)
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon insert products" ON public.products;
CREATE POLICY "Allow anon insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update products" ON public.products;
CREATE POLICY "Allow anon update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon delete products" ON public.products;
CREATE POLICY "Allow anon delete products" ON public.products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon manage settings" ON public.settings;
CREATE POLICY "Allow anon manage settings" ON public.settings FOR ALL USING (true);

-- 5. Insert or Update AB INDUSTRY Products
INSERT INTO public.products (id, n, pr, price_num, sizes, cat, cat_name, b, c, img, back, imgs, video, in_scroll, top_position, sort_order, fabric, pieces, stock, d)
VALUES
(
    'prod-ab-1',
    'Men’s Set: Hoodie + Baggy Jeans',
    '$65.00',
    65.00,
    'S, M, L, XL, XXL',
    'new',
    'MEN’S COLLECTION',
    'NEW',
    'b-new',
    'a1',
    'a2',
    '[{"k": "a1", "l": "Set front"}, {"k": "a2", "l": "Set back"}, {"k": "a3", "l": "Hoodie front"}, {"k": "a4", "l": "Hoodie back"}, {"k": "a5", "l": "Jeans front"}, {"k": "a6", "l": "Jeans back"}, {"k": "a7", "l": "Logo detail"}, {"k": "a8", "l": "Fabric"}]'::jsonb,
    '',
    true,
    true,
    1,
    'Premium Cotton Fleece & Denim',
    '2 Piece Set',
    'In Stock',
    'White hoodie with embroidered AB logo and black baggy jeans, sold as one set. Premium fabric, breathable, durable stitching.'
),
(
    'prod-ab-2',
    'Baggy Jeans & Hoodie Set',
    '$58.00',
    58.00,
    'S, M, L, XL',
    'new',
    'MEN’S COLLECTION',
    'SET',
    'b-sale',
    'b1',
    'b2',
    '[{"k": "b1", "l": "Front"}, {"k": "b2", "l": "Back"}, {"k": "b3", "l": "Hoodie detail"}, {"k": "b4", "l": "Logo detail"}, {"k": "b5", "l": "Jeans detail"}, {"k": "b6", "l": "Pocket"}]'::jsonb,
    '',
    true,
    false,
    2,
    'Denim & Fleece',
    '2 Piece Set',
    'In Stock',
    'Classic blue baggy jeans with the white AB hoodie. A casual look made for everyday comfort.'
),
(
    'prod-ab-3',
    'Hoodie & Tourizer',
    '$49.00',
    49.00,
    'S, M, L, XL, XXL',
    'new',
    'MEN’S COLLECTION',
    '2 COLOURS',
    'b-low',
    'y1',
    'y2',
    '[{"k": "y1", "l": "Front"}, {"k": "y2", "l": "Back"}, {"k": "y3", "l": "Hoodie detail"}, {"k": "y4", "l": "Trouser detail"}, {"k": "y5", "l": "Fabric"}]'::jsonb,
    '',
    true,
    false,
    3,
    'Soft Fleece',
    '2 Piece Set',
    'In Stock',
    'Baggy-style hoodie and jogger tourizer in soft, breathable fabric. Available in yellow and white.'
),
(
    'prod-ab-4',
    'Men’s Hoodie & Trouser',
    '$55.00',
    55.00,
    'M, L, XL, XXL',
    'new',
    'MEN’S COLLECTION',
    '6 COLOURS',
    'b-low',
    'm1',
    'm2',
    '[{"k": "m1", "l": "Front"}, {"k": "m2", "l": "Back"}, {"k": "m3", "l": "Adjustable hood"}, {"k": "m4", "l": "Logo print"}, {"k": "m5", "l": "Waistband"}, {"k": "m6", "l": "Side pockets"}]'::jsonb,
    '',
    true,
    false,
    4,
    'Colour-block Fleece',
    '2 Piece Set',
    'In Stock',
    'Baggy-style colour-block hoodie and trouser set with adjustable drawstring hood, high quality logo print, elastic waistband and side pockets. Available in 6 colours.'
),
(
    'prod-ab-5',
    'Pink Zip Jacket & Cargo Set',
    '$62.00',
    62.00,
    'S, M, L, XL',
    'sig',
    'WOMEN’S COLLECTION',
    'NEW',
    'b-new',
    'p1',
    'p2',
    '[{"k": "p1", "l": "Front"}, {"k": "p2", "l": "Back"}, {"k": "p3", "l": "Hoodie detail"}, {"k": "p4", "l": "Zipper"}, {"k": "p5", "l": "Sleeve"}, {"k": "p6", "l": "Pocket"}]'::jsonb,
    '',
    true,
    false,
    5,
    'Cotton Fleece & Cargo Twill',
    '2 Piece Set',
    'In Stock',
    'Pink and white zip hooded jacket with wide-leg cargo pants. Set includes jacket and pant.'
),
(
    'prod-ab-6',
    'Women’s Baby Pink Hoodie',
    '$42.00',
    42.00,
    'S, M, L, XL, XXL',
    'sig',
    'WOMEN’S COLLECTION',
    'WOMEN',
    'b-low',
    'h1',
    'h2',
    '[{"k": "h1", "l": "Front"}, {"k": "h2", "l": "Back"}, {"k": "h3", "l": "Hood"}, {"k": "h4", "l": "Logo detail"}, {"k": "h5", "l": "Ribbed cuffs"}]'::jsonb,
    '',
    true,
    false,
    6,
    'Baby Pink Fleece',
    '1 Piece Hoodie',
    'In Stock',
    'Baggy-style hoodie in baby pink with drawstring hood and ribbed cuffs. Comfort meets style.'
)
ON CONFLICT (id) DO UPDATE SET
    n = EXCLUDED.n,
    pr = EXCLUDED.pr,
    price_num = EXCLUDED.price_num,
    sizes = EXCLUDED.sizes,
    cat = EXCLUDED.cat,
    cat_name = EXCLUDED.cat_name,
    b = EXCLUDED.b,
    c = EXCLUDED.c,
    img = EXCLUDED.img,
    back = EXCLUDED.back,
    imgs = EXCLUDED.imgs,
    video = EXCLUDED.video,
    in_scroll = EXCLUDED.in_scroll,
    top_position = EXCLUDED.top_position,
    sort_order = EXCLUDED.sort_order,
    fabric = EXCLUDED.fabric,
    pieces = EXCLUDED.pieces,
    stock = EXCLUDED.stock,
    d = EXCLUDED.d;

-- 6. Insert Store Settings
INSERT INTO public.settings (key, value)
VALUES (
    'general',
    jsonb_build_object(
        'whatsapp', '923077536327',
        'brandName', 'AB INDUSTRY',
        'tagline', 'WEAR YOUR STYLE',
        'instagram', '@abindustry',
        'currency', '$',
        'adminPin', '1423',
        'categories', jsonb_build_array(
            jsonb_build_object('id', 'new', 'name', 'MEN’S COLLECTION', 'badge', 'MEN'),
            jsonb_build_object('id', 'sig', 'name', 'WOMEN’S COLLECTION', 'badge', 'WOMEN')
        )
    )
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = timezone('utc'::text, now());
