-- Migration: Add all necessary lighting fields to equipment_lighting table
-- Date: 2025-10-21
-- Description: Comprehensive migration to ensure all lighting fields exist in avancement2.equipment_lighting

USE avancement2;

-- Check if columns already exist before adding
SET @dbname = 'avancement2';
SET @tablename = 'equipment_lighting';

-- Add panneau_eclairage column
SET @columnname = 'panneau_eclairage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column panneau_eclairage already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN panneau_eclairage VARCHAR(100) NULL COMMENT ''Panneau d\'\'éclairage option: oui_sdv, oui_sdv_avec_exterieur, non'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add nb_points_lumineux_interieur column
SET @columnname = 'nb_points_lumineux_interieur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column nb_points_lumineux_interieur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN nb_points_lumineux_interieur INT NULL DEFAULT 0 COMMENT ''Number of interior light points'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add ref_ecl_panneau column (stores pipe-separated references for light points)
SET @columnname = 'ref_ecl_panneau';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column ref_ecl_panneau already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN ref_ecl_panneau TEXT NULL COMMENT ''Pipe-separated references for interior light points (e.g., REF1 | REF2 | REF3)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add nb_contacteurs column (number of contactors for interior)
SET @columnname = 'nb_contacteurs';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column nb_contacteurs already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN nb_contacteurs INT NULL DEFAULT 0 COMMENT ''Number of contactors for interior lighting'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add ref_disjoncteur_contacteur column (stores complex contactor/circuit breaker structure for interior)
SET @columnname = 'ref_disjoncteur_contacteur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column ref_disjoncteur_contacteur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN ref_disjoncteur_contacteur TEXT NULL COMMENT ''Interior contactor structure: contactorType:nbDisjoncteurs:disjType ref | disjType ref || nextContactor (e.g., tetra:3:mono ref1|tetra ref2|tetra ref3 || mono:2:mono ref4|mono ref5)'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add nb_contacteurs_biphase_interieur column
SET @columnname = 'nb_contacteurs_biphase_interieur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column nb_contacteurs_biphase_interieur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN nb_contacteurs_biphase_interieur INT NULL DEFAULT 0 COMMENT ''Number of biphasic contactors for interior lighting'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add commande_contacteur_interieur column
SET @columnname = 'commande_contacteur_interieur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column commande_contacteur_interieur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN commande_contacteur_interieur VARCHAR(100) NULL COMMENT ''Interior contactor control type'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add nb_points_lumineux_exterieur column
SET @columnname = 'nb_points_lumineux_exterieur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column nb_points_lumineux_exterieur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN nb_points_lumineux_exterieur INT NULL DEFAULT 0 COMMENT ''Number of exterior light points'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add commande_contacteur_exterieur column
SET @columnname = 'commande_contacteur_exterieur';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column commande_contacteur_exterieur already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN commande_contacteur_exterieur VARCHAR(100) NULL COMMENT ''Exterior contactor control: oui, oui_avec_crepusculaire, non'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add nb_contacteurs_ext column (number of contactors for exterior)
SET @columnname = 'nb_contacteurs_ext';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column nb_contacteurs_ext already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN nb_contacteurs_ext INT NULL DEFAULT 0 COMMENT ''Number of contactors for exterior lighting'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add ref_disjoncteur_contacteur_ext column (stores complex contactor/circuit breaker structure for exterior)
SET @columnname = 'ref_disjoncteur_contacteur_ext';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column ref_disjoncteur_contacteur_ext already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN ref_disjoncteur_contacteur_ext TEXT NULL COMMENT ''Exterior contactor structure: contactorType:nbDisjoncteurs:disjType ref | disjType ref || nextContactor'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add commande_horloge_crepusculaire column
SET @columnname = 'commande_horloge_crepusculaire';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column commande_horloge_crepusculaire already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN commande_horloge_crepusculaire VARCHAR(100) NULL COMMENT ''Clock/twilight control type'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add commentaire_eclairage column
SET @columnname = 'commentaire_eclairage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column commentaire_eclairage already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN commentaire_eclairage TEXT NULL COMMENT ''Lighting comments'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add etat_vetuste_eclairage column
SET @columnname = 'etat_vetuste_eclairage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column etat_vetuste_eclairage already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN etat_vetuste_eclairage VARCHAR(100) NULL COMMENT ''Lighting equipment condition'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add localisation_eclairage column
SET @columnname = 'localisation_eclairage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column localisation_eclairage already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN localisation_eclairage VARCHAR(255) NULL COMMENT ''Lighting location'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add localisation_comptage_eclairage column
SET @columnname = 'localisation_comptage_eclairage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT ''Column localisation_comptage_eclairage already exists.'' AS msg',
  'ALTER TABLE equipment_lighting ADD COLUMN localisation_comptage_eclairage VARCHAR(255) NULL COMMENT ''Lighting meter location'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify all columns were added
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'avancement2'
  AND TABLE_NAME = 'equipment_lighting'
  AND COLUMN_NAME IN (
    'panneau_eclairage',
    'nb_points_lumineux_interieur',
    'ref_ecl_panneau',
    'nb_contacteurs',
    'ref_disjoncteur_contacteur',
    'nb_contacteurs_biphase_interieur',
    'commande_contacteur_interieur',
    'nb_points_lumineux_exterieur',
    'commande_contacteur_exterieur',
    'nb_contacteurs_ext',
    'ref_disjoncteur_contacteur_ext',
    'commande_horloge_crepusculaire',
    'commentaire_eclairage',
    'etat_vetuste_eclairage',
    'localisation_eclairage',
    'localisation_comptage_eclairage'
  )
ORDER BY ORDINAL_POSITION;

SELECT '✅ Migration completed: All lighting fields added successfully to avancement2.equipment_lighting' AS status;
