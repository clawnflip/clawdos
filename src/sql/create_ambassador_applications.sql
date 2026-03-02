-- Create the table
CREATE TABLE public.ambassador_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    x_handle TEXT NOT NULL,
    telegram_handle TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert an application
CREATE POLICY "Allow public inserts on ambassador_applications" 
ON public.ambassador_applications
FOR INSERT 
TO public
WITH CHECK (true);

-- Create policy to allow only authenticated users to view applications
CREATE POLICY "Allow authenticated users to view ambassador_applications" 
ON public.ambassador_applications
FOR SELECT 
TO authenticated
USING (true);
