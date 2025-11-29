-- Add new question type for multiple choice with multiple answers
-- Note: We don't need to modify the answers table structure
-- We'll simply create multiple answer records for multi-select questions

-- Add a constraint to allow multiple answers per question for multi-select
-- First, let's add a column to track if a question allows multiple answers
ALTER TABLE public.questions 
ADD COLUMN allow_multiple_answers boolean NOT NULL DEFAULT false;

-- Update RLS policies for profiles (if we want to add user profiles later)
-- For now, we'll keep it simple and just track user_id on surveys

-- Add user_id to surveys table to track ownership
ALTER TABLE public.surveys 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_surveys_user_id ON public.surveys(user_id);

-- Update RLS policies for surveys
DROP POLICY IF EXISTS "Anyone can view surveys" ON public.surveys;
DROP POLICY IF EXISTS "Anyone can create surveys" ON public.surveys;

CREATE POLICY "Anyone can view surveys"
ON public.surveys
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create surveys"
ON public.surveys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys"
ON public.surveys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys"
ON public.surveys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);