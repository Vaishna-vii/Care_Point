-- Optional master-list completion: adds missing Indian States and Union Territories.
-- Safe to re-run: existing names (case-insensitive) are not inserted again.
-- This does NOT invent districts, cities, dispensaries or hospital records.
USE dispensary_db;

INSERT INTO state (state_name)
SELECT seed.state_name
FROM (
  SELECT 'Andhra Pradesh' AS state_name UNION ALL
  SELECT 'Arunachal Pradesh' UNION ALL
  SELECT 'Assam' UNION ALL
  SELECT 'Bihar' UNION ALL
  SELECT 'Chhattisgarh' UNION ALL
  SELECT 'Goa' UNION ALL
  SELECT 'Gujarat' UNION ALL
  SELECT 'Haryana' UNION ALL
  SELECT 'Himachal Pradesh' UNION ALL
  SELECT 'Jharkhand' UNION ALL
  SELECT 'Karnataka' UNION ALL
  SELECT 'Kerala' UNION ALL
  SELECT 'Madhya Pradesh' UNION ALL
  SELECT 'Maharashtra' UNION ALL
  SELECT 'Manipur' UNION ALL
  SELECT 'Meghalaya' UNION ALL
  SELECT 'Mizoram' UNION ALL
  SELECT 'Nagaland' UNION ALL
  SELECT 'Odisha' UNION ALL
  SELECT 'Punjab' UNION ALL
  SELECT 'Rajasthan' UNION ALL
  SELECT 'Sikkim' UNION ALL
  SELECT 'Tamil Nadu' UNION ALL
  SELECT 'Telangana' UNION ALL
  SELECT 'Tripura' UNION ALL
  SELECT 'Uttar Pradesh' UNION ALL
  SELECT 'Uttarakhand' UNION ALL
  SELECT 'West Bengal' UNION ALL
  SELECT 'Andaman and Nicobar Islands' UNION ALL
  SELECT 'Chandigarh' UNION ALL
  SELECT 'Dadra and Nagar Haveli and Daman and Diu' UNION ALL
  SELECT 'Delhi' UNION ALL
  SELECT 'Jammu and Kashmir' UNION ALL
  SELECT 'Ladakh' UNION ALL
  SELECT 'Lakshadweep' UNION ALL
  SELECT 'Puducherry'
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM state existing
  WHERE LOWER(TRIM(existing.state_name)) = LOWER(TRIM(seed.state_name))
);

SELECT COUNT(*) AS state_and_union_territory_master_count FROM state;
