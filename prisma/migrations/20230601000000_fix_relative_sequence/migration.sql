DO $$
   DECLARE
     seq_name text;
   BEGIN
     SELECT pg_get_serial_sequence('"Relative"', 'id') INTO seq_name;
     EXECUTE format('SELECT setval(%L, (SELECT COALESCE(MAX(id), 1) FROM "Relative"))', seq_name);
   END $$;