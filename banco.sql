CREATE DATABASE IF NOT EXISTS avaliacao_n3
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE avaliacao_n3;

CREATE TABLE IF NOT EXISTS tutor (
    cpf CHAR(11) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS altura_pet (
    id_altura TINYINT UNSIGNED PRIMARY KEY,
    altura VARCHAR(10) NOT NULL UNIQUE
);

INSERT IGNORE INTO altura_pet (id_altura, altura)
VALUES (1, 'pequeno'), (2, 'média'), (3, 'alto');

CREATE TABLE IF NOT EXISTS pet (
    codigo_pet INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome_pet VARCHAR(100) NOT NULL,
    genero_pet VARCHAR(30) NOT NULL,
    altura_cm DECIMAL(7,2) NOT NULL,
    cpf_tutor CHAR(11) NOT NULL,
    id_altura TINYINT UNSIGNED NOT NULL,
    CONSTRAINT chk_pet_altura CHECK (altura_cm > 0),
    CONSTRAINT fk_pet_tutor FOREIGN KEY (cpf_tutor) REFERENCES tutor (cpf)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pet_altura FOREIGN KEY (id_altura) REFERENCES altura_pet (id_altura)
);

CREATE OR REPLACE VIEW vw_ficha_pet AS
SELECT p.codigo_pet, p.nome_pet, p.genero_pet, p.altura_cm,
       a.altura AS porte, t.cpf, t.nome AS tutor, t.email
FROM pet p
JOIN tutor t ON t.cpf = p.cpf_tutor
JOIN altura_pet a ON a.id_altura = p.id_altura;

CREATE OR REPLACE VIEW vw_ocupacao_portes AS
SELECT a.id_altura, a.altura, COUNT(p.codigo_pet) AS total_pets,
       COUNT(DISTINCT p.cpf_tutor) AS total_tutores
FROM altura_pet a
LEFT JOIN pet p ON p.id_altura = a.id_altura
GROUP BY a.id_altura, a.altura;

DROP TRIGGER IF EXISTS trg_pet_altura_insert;
DROP TRIGGER IF EXISTS trg_pet_altura_update;
DROP PROCEDURE IF EXISTS sp_transferir_pet;
DROP PROCEDURE IF EXISTS sp_perfil_por_porte;

DELIMITER $$

CREATE TRIGGER trg_pet_altura_insert
BEFORE INSERT ON pet
FOR EACH ROW
SET NEW.id_altura = CASE
    WHEN NEW.altura_cm <= 13 THEN 1
    WHEN NEW.altura_cm > 14 AND NEW.altura_cm < 40 THEN 2
    ELSE 3
END$$

CREATE TRIGGER trg_pet_altura_update
BEFORE UPDATE ON pet
FOR EACH ROW
SET NEW.id_altura = CASE
    WHEN NEW.altura_cm <= 13 THEN 1
    WHEN NEW.altura_cm > 14 AND NEW.altura_cm < 40 THEN 2
    ELSE 3
END$$

CREATE PROCEDURE sp_transferir_pet(IN p_codigo INT UNSIGNED, IN p_cpf CHAR(11))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pet WHERE codigo_pet = p_codigo) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pet não encontrado.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tutor WHERE cpf = p_cpf) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tutor não encontrado.';
    END IF;

    UPDATE pet SET cpf_tutor = p_cpf WHERE codigo_pet = p_codigo;

    SELECT codigo_pet, nome_pet, cpf, tutor
    FROM vw_ficha_pet
    WHERE codigo_pet = p_codigo;
END$$

CREATE PROCEDURE sp_perfil_por_porte(IN p_minimo INT UNSIGNED)
BEGIN
    SELECT a.id_altura, a.altura, t.cpf, t.nome,
           COUNT(*) AS total_pets, ROUND(AVG(p.altura_cm), 2) AS media_cm,
           MIN(p.altura_cm) AS menor_cm, MAX(p.altura_cm) AS maior_cm
    FROM pet p
    JOIN tutor t ON t.cpf = p.cpf_tutor
    JOIN altura_pet a ON a.id_altura = p.id_altura
    GROUP BY a.id_altura, a.altura, t.cpf, t.nome
    HAVING COUNT(*) >= p_minimo
    ORDER BY a.id_altura, total_pets DESC, t.cpf;
END$$

DELIMITER ;
