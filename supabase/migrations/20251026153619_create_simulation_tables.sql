/*
  # EV Powertrain Simulation Database Schema

  1. New Tables
    - `simulation_runs`
      - Stores each simulation run with configuration and results
      - `id` (uuid, primary key)
      - `vehicle_type` (text) - scooter, 3w_cargo, passenger_ev
      - `driving_cycle` (text) - WLTP, NEDC, urban, highway
      - `battery_capacity` (numeric) - in kWh
      - `motor_power` (numeric) - in kW
      - `vehicle_mass` (numeric) - in kg
      - `regen_efficiency` (numeric) - regenerative braking efficiency %
      - `total_distance` (numeric) - km
      - `energy_consumed` (numeric) - kWh
      - `energy_recovered` (numeric) - kWh
      - `final_soc` (numeric) - %
      - `avg_efficiency` (numeric) - Wh/km
      - `created_at` (timestamptz)
    
    - `simulation_data_points`
      - Time-series data for each simulation
      - `id` (uuid, primary key)
      - `simulation_id` (uuid, foreign key)
      - `time` (numeric) - seconds
      - `speed` (numeric) - km/h
      - `acceleration` (numeric) - m/s²
      - `motor_torque` (numeric) - Nm
      - `motor_power` (numeric) - kW
      - `battery_soc` (numeric) - %
      - `battery_current` (numeric) - A
      - `energy_flow` (numeric) - kW (positive = discharge, negative = charge)
      - `is_regenerating` (boolean)

  2. Security
    - Enable RLS on all tables
    - Public read access for simulation data (for examiners to view)
*/

CREATE TABLE IF NOT EXISTS simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type text NOT NULL,
  driving_cycle text NOT NULL,
  battery_capacity numeric NOT NULL,
  motor_power numeric NOT NULL,
  vehicle_mass numeric NOT NULL,
  regen_efficiency numeric NOT NULL DEFAULT 0.7,
  total_distance numeric DEFAULT 0,
  energy_consumed numeric DEFAULT 0,
  energy_recovered numeric DEFAULT 0,
  final_soc numeric DEFAULT 100,
  avg_efficiency numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS simulation_data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid REFERENCES simulation_runs(id) ON DELETE CASCADE,
  time numeric NOT NULL,
  speed numeric NOT NULL,
  acceleration numeric NOT NULL,
  motor_torque numeric NOT NULL,
  motor_power numeric NOT NULL,
  battery_soc numeric NOT NULL,
  battery_current numeric NOT NULL,
  energy_flow numeric NOT NULL,
  is_regenerating boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_data_points ENABLE ROW LEVEL SECURITY;

-- Allow public read access for examiners
CREATE POLICY "Anyone can view simulation runs"
  ON simulation_runs
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert simulation runs"
  ON simulation_runs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view simulation data"
  ON simulation_data_points
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert simulation data"
  ON simulation_data_points
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS simulation_data_points_simulation_id_idx ON simulation_data_points(simulation_id);
CREATE INDEX IF NOT EXISTS simulation_data_points_time_idx ON simulation_data_points(time);