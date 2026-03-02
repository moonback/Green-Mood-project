-- Remove "minor" age option from BudTender configuration if it exists in store_settings
-- This is a safety measure to ensure compliance even if the settings were previously saved.

DO $$
DECLARE
    current_config jsonb;
    updated_config jsonb;
    step_idx int;
    opt_idx int;
BEGIN
    -- Get the current config
    SELECT value INTO current_config FROM public.store_settings WHERE key = 'budtender_config';
    
    IF current_config IS NOT NULL AND current_config ? 'quiz_steps' THEN
        -- Loop through quiz steps to find 'age' step
        FOR step_idx IN 0..jsonb_array_length(current_config->'quiz_steps') - 1 LOOP
            IF (current_config->'quiz_steps'->step_idx->>'id') = 'age' THEN
                -- Rebuild the options array WITHOUT the 'minor' value
                updated_config := jsonb_set(
                    current_config,
                    array['quiz_steps', step_idx::text, 'options'],
                    (
                        SELECT jsonb_agg(opt)
                        FROM jsonb_array_elements(current_config->'quiz_steps'->step_idx->'options') AS opt
                        WHERE opt->>'value' != 'minor'
                    )
                );
                
                -- Update the settings in DB
                UPDATE public.store_settings 
                SET value = updated_config, 
                    updated_at = now() 
                WHERE key = 'budtender_config';
                
                RAISE NOTICE 'Removed minor option from age step in store_settings';
            END IF;
        END LOOP;
    END IF;
END $$;
