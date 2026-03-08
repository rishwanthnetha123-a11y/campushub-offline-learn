-- Fix existing HOD profiles missing department_id
UPDATE profiles
SET department_id = subq.dept_id
FROM (
  SELECT p.id as profile_id, ri.department_id as dept_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'hod'
  JOIN role_invites ri ON ri.email = p.email AND ri.role = 'hod' AND ri.accepted = true AND ri.department_id IS NOT NULL
  WHERE p.department_id IS NULL
) subq
WHERE profiles.id = subq.profile_id;