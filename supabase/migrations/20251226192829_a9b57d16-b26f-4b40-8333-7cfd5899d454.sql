-- Create a table for storing public preview data
CREATE TABLE public.app_previews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    app_name TEXT NOT NULL UNIQUE,
    html_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_previews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read previews (public)
CREATE POLICY "Anyone can view previews" 
ON public.app_previews 
FOR SELECT 
USING (true);

-- Allow authenticated users to create/update previews
CREATE POLICY "Authenticated users can create previews" 
ON public.app_previews 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update previews" 
ON public.app_previews 
FOR UPDATE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_previews_updated_at
BEFORE UPDATE ON public.app_previews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();