IF OBJECT_ID(N'dbo.WebCustomerSavedView', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebCustomerSavedView (
    UserKey nvarchar(128) NOT NULL,
    Slot int NOT NULL CHECK (Slot BETWEEN 1 AND 64),
    ViewName nvarchar(80) NOT NULL,
    LayoutJson nvarchar(max) NOT NULL CHECK (ISJSON(LayoutJson)=1),
    UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_WebCustomerSavedView PRIMARY KEY (UserKey, Slot)
  );
END;
