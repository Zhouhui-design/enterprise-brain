-- 创建页面设置表
CREATE TABLE [page_settings] (
  [id] int NOT NULL IDENTITY(1,1),
  [page_key] varchar(100) NOT NULL,
  [setting_key] varchar(100) NOT NULL,
  [setting_value] text,
  [created_at] datetime NULL DEFAULT GETDATE(),
  [updated_at] datetime NULL DEFAULT GETDATE(),
  PRIMARY KEY ([id]),
  CONSTRAINT unique_page_setting UNIQUE ([page_key],[setting_key])
);

-- 插入默认数据
SET IDENTITY_INSERT [page_settings] ON;
MERGE [page_settings] AS target
USING (VALUES 
  (1,'capacity-load','displayDays','120','2025-12-08 09:30:38','2025-12-08 09:30:38'),
  (2,'company-calendar','daysBeforeToday','90','2025-12-08 10:15:50','2025-12-08 10:15:50'),
  (3,'company-calendar','daysAfterToday','180','2025-12-08 10:15:50','2025-12-08 23:02:07'),
  (4,'company-calendar','standardWorkHours','8','2025-12-08 10:15:50','2025-12-08 10:15:50'),
  (5,'company-calendar','weekendMode','single','2025-12-08 10:15:50','2025-12-08 23:02:07')
) AS source ([id], [page_key], [setting_key], [setting_value], [created_at], [updated_at])
ON (target.[id] = source.[id])
WHEN MATCHED THEN
  UPDATE SET 
    [page_key] = source.[page_key],
    [setting_key] = source.[setting_key],
    [setting_value] = source.[setting_value],
    [created_at] = source.[created_at],
    [updated_at] = source.[updated_at]
WHEN NOT MATCHED THEN
  INSERT ([id], [page_key], [setting_key], [setting_value], [created_at], [updated_at])
  VALUES (source.[id], source.[page_key], source.[setting_key], source.[setting_value], source.[created_at], source.[updated_at]);
SET IDENTITY_INSERT [page_settings] OFF;