-- Create a new table for pending checkouts
CREATE TABLE IF NOT EXISTS pending_checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_items JSONB NOT NULL,
  shipping_address JSONB,
  payment_method TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  pix_transaction_id TEXT,
  pix_code TEXT,
  pix_qr_code TEXT,
  pix_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  contacted BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT DEFAULT 'pending' NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS pending_checkouts_user_id_idx ON pending_checkouts(user_id);
CREATE INDEX IF NOT EXISTS pending_checkouts_status_idx ON pending_checkouts(status);
CREATE INDEX IF NOT EXISTS pending_checkouts_created_at_idx ON pending_checkouts(created_at);

-- Add RLS policies
ALTER TABLE pending_checkouts ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own pending checkouts
CREATE POLICY "Users can view their own pending checkouts"
  ON pending_checkouts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own pending checkouts
CREATE POLICY "Users can insert their own pending checkouts"
  ON pending_checkouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own pending checkouts
CREATE POLICY "Users can update their own pending checkouts"
  ON pending_checkouts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow admins to view all pending checkouts
CREATE POLICY "Admins can view all pending checkouts"
  ON pending_checkouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update all pending checkouts
CREATE POLICY "Admins can update all pending checkouts"
  ON pending_checkouts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
