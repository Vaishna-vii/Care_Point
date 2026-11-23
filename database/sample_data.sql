-- CarePoint synthetic application demo data
-- Run AFTER schema.sql and government_directory_data.sql on a fresh database.
-- All users below are DISABLED demo accounts with non-login placeholder hashes.
-- Create a real Super Admin using the backend seed script; do not reuse demo accounts.
USE `dispensary_db`;
START TRANSACTION;

-- Disabled users exist only to demonstrate relational records in admin tables.
INSERT INTO `app_user`
(`user_id`,`full_name`,`email`,`password_hash`,`phone`,`role`,`managed_dispensary_id`,`is_active`)
VALUES
(990001,'Demo Client','demo.client@example.invalid','!DISABLED_DEMO_ACCOUNT_NO_LOGIN!',NULL,'client',NULL,0),
(990002,'Demo Dispensary Admin','demo.admin@example.invalid','!DISABLED_DEMO_ACCOUNT_NO_LOGIN!',NULL,'dispensary_admin',1,0);

INSERT INTO `medicine`
(`medicine_id`,`medicine_name`,`generic_name`,`category`,`dosage_form`,`strength`,`requires_prescription`,`is_demo`,`is_active`)
VALUES
(990001,'Demo Paracetamol','Paracetamol','Analgesic','Tablet','500 mg',0,1,1),
(990002,'Demo Cetirizine','Cetirizine','Antihistamine','Tablet','10 mg',0,1,1),
(990003,'Demo ORS','Oral Rehydration Salts','Rehydration','Sachet','21 g',0,1,1),
(990004,'Demo Amoxicillin','Amoxicillin','Antibiotic','Capsule','500 mg',1,1,1);

-- Inventory is attached to the first directory dispensary imported from the CSV.
INSERT INTO `dispensary_inventory`
(`dispensary_id`,`medicine_id`,`quantity_on_hand`,`reorder_level`,`is_demo`)
VALUES
(1,990001,100,20,1),
(1,990002,60,15,1),
(1,990003,80,20,1),
(1,990004,25,10,1);

INSERT INTO `appointment_request`
(`appointment_id`,`user_id`,`dispensary_id`,`service_id`,`preferred_date`,`time_slot`,`reason`,`status`,`admin_remarks`,`processed_by`)
VALUES
(990001,990001,1,NULL,'2026-12-01','morning','Demo appointment request','pending',NULL,NULL),
(990002,990001,1,NULL,'2026-12-03','afternoon','Demo follow-up consultation','confirmed','Demo confirmation record',990002);

INSERT INTO `feedback`
(`feedback_id`,`user_id`,`dispensary_id`,`rating`,`comment`)
VALUES
(990001,990001,1,5,'Synthetic demo feedback record');

INSERT INTO `medicine_request`
(`request_id`,`user_id`,`dispensary_id`,`status`,`client_remarks`,`admin_remarks`,`processed_by`,`processed_at`,`dispensed_at`)
VALUES
(990001,990001,1,'pending','Demo medicine request',NULL,NULL,NULL,NULL),
(990002,990001,1,'approved','Demo approved request','Synthetic approval record',990002,NOW(),NULL);

INSERT INTO `medicine_request_item`
(`request_id`,`medicine_id`,`quantity_requested`,`quantity_approved`,`quantity_dispensed`)
VALUES
(990001,990001,10,NULL,0),
(990001,990003,2,NULL,0),
(990002,990002,5,5,0);

INSERT INTO `stock_transactions`
(`txn_id`,`dispensary_id`,`medicine_id`,`txn_type`,`quantity_change`,`quantity_after`,`request_id`,`performed_by`,`remarks`)
VALUES
(990001,1,990001,'opening',100,100,NULL,990002,'Synthetic opening stock record'),
(990002,1,990002,'opening',60,60,NULL,990002,'Synthetic opening stock record'),
(990003,1,990003,'opening',80,80,NULL,990002,'Synthetic opening stock record'),
(990004,1,990004,'opening',25,25,NULL,990002,'Synthetic opening stock record');

INSERT INTO `audit_log`
(`log_id`,`admin_id`,`action_type`,`entity_type`,`entity_id`,`details`,`ip_address`)
VALUES
(990001,990002,'DEMO_SEED','inventory','1','{"note":"Synthetic demonstration audit entry"}',NULL),
(990002,990002,'DEMO_SEED','appointment','990002','{"note":"Synthetic demonstration audit entry"}',NULL);

COMMIT;

-- app_user IDs 990001/990002 are inactive and cannot be used to log in.
-- Real accounts should be created through the application's registration/admin flow.
